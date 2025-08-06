"""
Web Search Tool using Brave Search API

Provides intelligent web search capabilities for research agents.
"""

import httpx
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Individual search result"""
    title: str
    url: str
    description: str
    age: Optional[str] = None
    score: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "description": self.description,
            "age": self.age,
            "score": self.score
        }


class WebSearchError(Exception):
    """Base exception for web search errors"""
    pass


class WebSearchTool:
    """
    Web search tool using Brave Search API
    
    Provides intelligent web search with result ranking and filtering.
    """
    
    def __init__(self, api_key: str, timeout: int = 10):
        self.api_key = api_key
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        
        # Brave Search API endpoint
        self.base_url = "https://api.search.brave.com/res/v1"
    
    async def search(
        self,
        query: str,
        count: int = 10,
        offset: int = 0,
        country: str = "US",
        search_lang: str = "en",
        ui_lang: str = "en-US",
        safesearch: str = "moderate",
        freshness: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Search the web using Brave Search API
        
        Args:
            query: Search query
            count: Number of results to return (1-20)
            offset: Offset for pagination
            country: Country code for search region
            search_lang: Language for search
            ui_lang: UI language
            safesearch: Safe search setting (off, moderate, strict)
            freshness: Freshness filter (pd, pw, pm, py for past day/week/month/year)
            
        Returns:
            List of SearchResult objects
        """
        try:
            # Validate count
            count = min(max(count, 1), 20)
            
            # Prepare search parameters
            params = {
                "q": query,
                "count": count,
                "offset": offset,
                "country": country,
                "search_lang": search_lang,
                "ui_lang": ui_lang,
                "safesearch": safesearch
            }
            
            if freshness:
                params["freshness"] = freshness
            
            # Prepare headers
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": self.api_key
            }
            
            logger.info(f"Searching for: '{query}' (count: {count})")
            
            # Make the API request
            response = await self.client.get(
                f"{self.base_url}/web/search",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Parse results
            results = []
            web_results = data.get("web", {}).get("results", [])
            
            for result in web_results:
                search_result = SearchResult(
                    title=result.get("title", ""),
                    url=result.get("url", ""),
                    description=result.get("description", ""),
                    age=result.get("age"),
                    score=result.get("score")
                )
                results.append(search_result)
            
            logger.info(f"Found {len(results)} results for query: '{query}'")
            return results
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise WebSearchError("Invalid Brave Search API key")
            elif e.response.status_code == 429:
                raise WebSearchError("Rate limit exceeded for Brave Search API")
            else:
                raise WebSearchError(f"HTTP error {e.response.status_code}: {e.response.text}")
        except Exception as e:
            raise WebSearchError(f"Search failed: {e}")
    
    async def search_with_analysis(
        self,
        query: str,
        count: int = 10,
        min_score: float = 0.5
    ) -> Dict[str, Any]:
        """
        Search with additional analysis and filtering
        
        Args:
            query: Search query
            count: Number of results to return
            min_score: Minimum relevance score for results
            
        Returns:
            Dictionary with results and analysis
        """
        try:
            # Perform the search
            results = await self.search(query, count)
            
            # Filter by score if available
            if min_score > 0:
                filtered_results = [
                    r for r in results 
                    if r.score is None or r.score >= min_score
                ]
            else:
                filtered_results = results
            
            # Analyze results
            analysis = self._analyze_results(filtered_results)
            
            return {
                "query": query,
                "total_results": len(results),
                "filtered_results": len(filtered_results),
                "results": [r.to_dict() for r in filtered_results],
                "analysis": analysis
            }
            
        except Exception as e:
            raise WebSearchError(f"Search with analysis failed: {e}")
    
    def _analyze_results(self, results: List[SearchResult]) -> Dict[str, Any]:
        """
        Analyze search results to extract insights
        
        Args:
            results: List of search results
            
        Returns:
            Analysis summary
        """
        if not results:
            return {"summary": "No results found"}
        
        # Extract domains
        domains = []
        for result in results:
            try:
                from urllib.parse import urlparse
                domain = urlparse(result.url).netloc
                domains.append(domain)
            except:
                continue
        
        # Count domain frequency
        domain_counts = {}
        for domain in domains:
            domain_counts[domain] = domain_counts.get(domain, 0) + 1
        
        # Get top domains
        top_domains = sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Calculate average score if available
        scores = [r.score for r in results if r.score is not None]
        avg_score = sum(scores) / len(scores) if scores else None
        
        return {
            "total_results": len(results),
            "top_domains": top_domains,
            "average_score": avg_score,
            "has_recent_results": any(r.age for r in results),
            "summary": f"Found {len(results)} results from {len(set(domains))} unique domains"
        }
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Convenience function for simple searches
async def search_web(
    api_key: str,
    query: str,
    count: int = 10,
    analyze: bool = True
) -> Dict[str, Any]:
    """
    Simple web search function
    
    Args:
        api_key: Brave Search API key
        query: Search query
        count: Number of results
        analyze: Whether to include analysis
        
    Returns:
        Search results with optional analysis
    """
    async with WebSearchTool(api_key) as search_tool:
        if analyze:
            return await search_tool.search_with_analysis(query, count)
        else:
            results = await search_tool.search(query, count)
            return {
                "query": query,
                "results": [r.to_dict() for r in results]
            }