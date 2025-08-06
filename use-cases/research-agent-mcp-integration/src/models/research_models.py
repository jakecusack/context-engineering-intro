"""
Pydantic models for research-related data structures
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class SearchResult(BaseModel):
    """Individual web search result"""
    title: str = Field(..., description="Title of the search result")
    url: HttpUrl = Field(..., description="URL of the search result")
    description: str = Field(..., description="Description/snippet from the search result")
    age: Optional[str] = Field(None, description="Age of the content (e.g., '2 days ago')")
    score: Optional[float] = Field(None, description="Relevance score (0.0 to 1.0)")
    domain: Optional[str] = Field(None, description="Domain of the source")


class SearchQuery(BaseModel):
    """Web search query parameters"""
    query: str = Field(..., description="Search query string")
    count: int = Field(default=10, ge=1, le=20, description="Number of results to return")
    freshness: Optional[str] = Field(
        None, 
        description="Freshness filter (pd=past day, pw=past week, pm=past month, py=past year)"
    )
    country: str = Field(default="US", description="Country code for search region")
    safe_search: str = Field(default="moderate", description="Safe search setting")


class SearchAnalysis(BaseModel):
    """Analysis of search results"""
    total_results: int = Field(..., description="Total number of search results")
    unique_domains: int = Field(..., description="Number of unique domains in results")
    average_score: Optional[float] = Field(None, description="Average relevance score")
    top_domains: List[tuple] = Field(default_factory=list, description="Most frequent domains")
    has_recent_results: bool = Field(default=False, description="Whether results include recent content")
    summary: str = Field(..., description="Summary of the search analysis")


class ResearchContext(BaseModel):
    """Context for research activities"""
    topic: str = Field(..., description="Main research topic")
    objectives: List[str] = Field(default_factory=list, description="Research objectives")
    focus_areas: List[str] = Field(default_factory=list, description="Specific areas to focus on")
    constraints: List[str] = Field(default_factory=list, description="Research constraints")
    timeline: Optional[str] = Field(None, description="Research timeline")
    target_audience: List[str] = Field(default_factory=list, description="Target audience for research")


class ResearchInsights(BaseModel):
    """Structured insights extracted from research"""
    key_technologies: List[str] = Field(default_factory=list, description="Key technologies mentioned")
    best_practices: List[str] = Field(default_factory=list, description="Best practices identified")
    common_challenges: List[str] = Field(default_factory=list, description="Common challenges found")
    performance_considerations: List[str] = Field(default_factory=list, description="Performance insights")
    security_considerations: List[str] = Field(default_factory=list, description="Security insights")
    recommended_tools: List[str] = Field(default_factory=list, description="Recommended tools")
    integration_patterns: List[str] = Field(default_factory=list, description="Integration patterns")
    testing_strategies: List[str] = Field(default_factory=list, description="Testing approaches")


class ResearchSession(BaseModel):
    """Complete research session data"""
    session_id: str = Field(..., description="Unique session identifier")
    topic: str = Field(..., description="Research topic")
    context: ResearchContext = Field(..., description="Research context")
    queries: List[SearchQuery] = Field(default_factory=list, description="Search queries executed")
    results: List[SearchResult] = Field(default_factory=list, description="All search results")
    insights: Optional[ResearchInsights] = Field(None, description="Extracted insights")
    prp_content: Optional[str] = Field(None, description="Generated PRP content")
    created_at: datetime = Field(default_factory=datetime.now, description="Session creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
    status: str = Field(default="active", description="Session status (active, completed, failed)")


class ResearchRequest(BaseModel):
    """Request for research and project creation"""
    topic: str = Field(..., description="What to research and create project for")
    project_goals: Optional[List[str]] = Field(None, description="Specific project goals")
    target_users: Optional[List[str]] = Field(None, description="Target users for the project")
    constraints: Optional[List[str]] = Field(None, description="Project constraints")
    timeline: Optional[str] = Field(None, description="Project timeline")
    search_depth: int = Field(default=10, ge=1, le=20, description="Number of search results to analyze")
    focus_areas: Optional[List[str]] = Field(None, description="Specific areas to focus research on")


class ResearchResponse(BaseModel):
    """Response from research and project creation"""
    success: bool = Field(..., description="Whether the operation was successful")
    session_id: str = Field(..., description="Research session ID")
    topic: str = Field(..., description="Research topic")
    search_results_count: int = Field(..., description="Number of search results found")
    prp_generated: bool = Field(..., description="Whether PRP was generated")
    prp_parsed: bool = Field(..., description="Whether PRP was parsed by MCP server")
    tasks_created: int = Field(default=0, description="Number of tasks created")
    documentation_created: int = Field(default=0, description="Number of documentation entries created")
    project_name: Optional[str] = Field(None, description="Generated project name")
    estimated_hours: Optional[int] = Field(None, description="Total estimated project hours")
    next_steps: List[str] = Field(default_factory=list, description="Recommended next steps")
    error_message: Optional[str] = Field(None, description="Error message if operation failed")