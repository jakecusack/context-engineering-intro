"""
PRP (Product Requirements Prompt) Writer Tool

Generates comprehensive PRPs from research findings using AI.
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from anthropic import AsyncAnthropic
import json

logger = logging.getLogger(__name__)


@dataclass
class ResearchInput:
    """Input data for PRP generation from research"""
    topic: str
    research_results: List[Dict[str, Any]]
    project_goals: Optional[List[str]] = None
    target_users: Optional[List[str]] = None
    constraints: Optional[List[str]] = None
    timeline: Optional[str] = None


class PRPWriterError(Exception):
    """Base exception for PRP writer errors"""
    pass


class PRPWriter:
    """
    AI-powered PRP writer that converts research findings into comprehensive
    Product Requirements Prompts following the established PRP format.
    """
    
    def __init__(self, anthropic_api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.client = AsyncAnthropic(api_key=anthropic_api_key)
        self.model = model
    
    async def write_prp_from_research(
        self,
        research_input: ResearchInput
    ) -> str:
        """
        Generate a comprehensive PRP from research findings
        
        Args:
            research_input: Research data and requirements
            
        Returns:
            Complete PRP as a markdown string
        """
        try:
            # Create the prompt for PRP generation
            prompt = self._build_prp_prompt(research_input)
            
            logger.info(f"Generating PRP for topic: {research_input.topic}")
            
            # Call Claude to generate the PRP
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            prp_content = response.content[0].text
            
            logger.info(f"Generated PRP ({len(prp_content)} characters)")
            return prp_content
            
        except Exception as e:
            raise PRPWriterError(f"Failed to generate PRP: {e}")
    
    def _build_prp_prompt(self, research_input: ResearchInput) -> str:
        """
        Build the prompt for PRP generation based on research findings
        
        Args:
            research_input: Research data and requirements
            
        Returns:
            Prompt string for Claude
        """
        # Format research results for the prompt
        research_summary = self._format_research_results(research_input.research_results)
        
        prompt = f"""
You are an expert technical product manager. Based on the research findings below, create a comprehensive Product Requirements Prompt (PRP) following the established format.

# Research Topic: {research_input.topic}

## Research Findings:
{research_summary}

## Additional Context:
{self._format_additional_context(research_input)}

# Instructions:

Create a comprehensive PRP that includes:

1. **Project Overview** - Clear description based on research
2. **Goals** - Specific, measurable objectives derived from findings
3. **Target Users** - User personas identified from research
4. **Core Features** - Key functionality based on research insights
5. **Technical Requirements** - Technology stack and architecture considerations
6. **Success Criteria** - Measurable outcomes and KPIs
7. **Timeline & Milestones** - Realistic development phases
8. **Constraints & Assumptions** - Technical and business limitations
9. **Risk Assessment** - Potential challenges and mitigation strategies

## PRP Format Requirements:

- Use clear, actionable language
- Include specific technical details from research
- Provide realistic time estimates for tasks
- Organize features by priority (Must-have, Should-have, Could-have)
- Reference research sources where relevant
- Make it comprehensive enough for AI to extract specific tasks

## Research-Based Requirements:
- Incorporate latest best practices found in research
- Address common challenges mentioned in sources
- Leverage recommended tools and technologies
- Include performance and security considerations from research

Generate a complete, actionable PRP that an AI system could parse to extract specific development tasks, documentation needs, and project structure.
"""
        
        return prompt
    
    def _format_research_results(self, results: List[Dict[str, Any]]) -> str:
        """Format research results for inclusion in the prompt"""
        if not results:
            return "No specific research results provided."
        
        formatted_results = []
        
        for i, result in enumerate(results, 1):
            title = result.get("title", "Unknown")
            url = result.get("url", "")
            description = result.get("description", "No description")
            
            formatted_results.append(f"""
### Source {i}: {title}
**URL:** {url}
**Key Points:** {description}
""")
        
        return "\n".join(formatted_results)
    
    def _format_additional_context(self, research_input: ResearchInput) -> str:
        """Format additional context information"""
        context_parts = []
        
        if research_input.project_goals:
            context_parts.append(f"**Project Goals:** {', '.join(research_input.project_goals)}")
        
        if research_input.target_users:
            context_parts.append(f"**Target Users:** {', '.join(research_input.target_users)}")
        
        if research_input.constraints:
            context_parts.append(f"**Constraints:** {', '.join(research_input.constraints)}")
        
        if research_input.timeline:
            context_parts.append(f"**Timeline:** {research_input.timeline}")
        
        return "\n".join(context_parts) if context_parts else "No additional context provided."
    
    async def extract_key_insights(
        self,
        research_results: List[Dict[str, Any]],
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Extract key insights from research results
        
        Args:
            research_results: List of search results
            focus_areas: Specific areas to focus analysis on
            
        Returns:
            Structured insights from the research
        """
        try:
            # Create prompt for insight extraction
            focus_text = f"Focus specifically on: {', '.join(focus_areas)}" if focus_areas else ""
            research_text = self._format_research_results(research_results)
            
            prompt = f"""
Analyze the following research results and extract key insights for product development.

{focus_text}

# Research Results:
{research_text}

Please provide a structured analysis with:

1. **Key Technologies/Tools** - Most mentioned and recommended
2. **Best Practices** - Common recommendations across sources
3. **Common Challenges** - Frequently mentioned problems and solutions
4. **Performance Considerations** - Speed, scalability, optimization insights
5. **Security Considerations** - Security best practices and concerns
6. **Development Workflow** - Recommended development approaches
7. **Integration Patterns** - How to integrate with other systems
8. **Testing Strategies** - Recommended testing approaches

Format as JSON with clear categories and actionable insights.
"""
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Try to parse as JSON, fallback to text
            try:
                insights = json.loads(response.content[0].text)
            except json.JSONDecodeError:
                insights = {"raw_analysis": response.content[0].text}
            
            return insights
            
        except Exception as e:
            raise PRPWriterError(f"Failed to extract insights: {e}")


# Convenience function for simple PRP generation
async def generate_prp_from_research(
    anthropic_api_key: str,
    topic: str,
    research_results: List[Dict[str, Any]],
    project_goals: Optional[List[str]] = None,
    target_users: Optional[List[str]] = None,
    timeline: Optional[str] = None
) -> str:
    """
    Simple function to generate PRP from research
    
    Args:
        anthropic_api_key: Anthropic API key
        topic: Research topic/project name
        research_results: Web search results
        project_goals: Optional project goals
        target_users: Optional target users
        timeline: Optional timeline
        
    Returns:
        Generated PRP content
    """
    writer = PRPWriter(anthropic_api_key)
    
    research_input = ResearchInput(
        topic=topic,
        research_results=research_results,
        project_goals=project_goals,
        target_users=target_users,
        timeline=timeline
    )
    
    return await writer.write_prp_from_research(research_input)