/**
 * Anthropic API Client for PRP Parsing
 * 
 * This service handles all interactions with the Anthropic Claude API
 * for parsing Product Requirements Prompts (PRPs) and extracting
 * structured task and documentation data.
 */

import { PRPParsingResult, ProjectContext } from '../types/prp-types';

export class AnthropicClient {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private anthropicVersion = '2023-06-01';

  constructor(apiKey: string, model: string = 'claude-3-5-haiku-latest') {
    if (!apiKey || apiKey === '<your_anthropic_api_key_here>') {
      throw new Error('Anthropic API key is required and must be properly configured');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Parse a PRP using Claude AI to extract structured data
   */
  async parsePRP(prpContent: string, projectContext?: Partial<ProjectContext>): Promise<PRPParsingResult> {
    if (!prpContent || prpContent.trim().length < 10) {
      throw new Error('PRP content must be at least 10 characters long');
    }

    const prompt = this.buildPRPParsingPrompt(prpContent, projectContext);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4000,
          messages: [{ 
            role: 'user', 
            content: prompt 
          }],
          temperature: 0.3 // Lower temperature for more consistent parsing
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const content = (result as any).content[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Anthropic API');
      }

      // Parse the JSON response with error handling
      try {
        const parsedResult = JSON.parse(content) as PRPParsingResult;
        
        // Validate the structure
        if (!parsedResult.tasks || !Array.isArray(parsedResult.tasks)) {
          throw new Error('Invalid response structure: tasks array is missing');
        }
        
        if (!parsedResult.documentation || !Array.isArray(parsedResult.documentation)) {
          throw new Error('Invalid response structure: documentation array is missing');
        }
        
        if (!parsedResult.projectContext || typeof parsedResult.projectContext !== 'object') {
          throw new Error('Invalid response structure: projectContext is missing');
        }

        return parsedResult;
      } catch (parseError) {
        console.error('Failed to parse Claude response:', content);
        throw new Error(`Failed to parse Claude response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error) {
      console.error('Anthropic API error:', error);
      
      // Re-throw with more context
      if (error instanceof Error && error.message.includes('API error')) {
        throw error; // Already has good context
      } else {
        throw new Error(`Failed to parse PRP: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Build a structured prompt for PRP parsing
   */
  private buildPRPParsingPrompt(prpContent: string, projectContext?: Partial<ProjectContext>): string {
    const contextSection = projectContext ? `
Additional Project Context:
- Project Name: ${projectContext.projectName || 'Not specified'}
- Description: ${projectContext.description || 'Not specified'}
- Known Goals: ${projectContext.goals?.join(', ') || 'Not specified'}
- Target Users: ${projectContext.targetUsers?.join(', ') || 'Not specified'}
` : '';

    return `
You are an expert at parsing Product Requirements Prompts (PRPs) and extracting structured task and documentation data.

Please analyze the following PRP content and extract:
1. Individual tasks with titles, descriptions, priorities, and estimated effort
2. Project documentation including goals, target users, and context
3. Any constraints, dependencies, or special considerations

${contextSection}

PRP Content:
${prpContent}

IMPORTANT INSTRUCTIONS:
- Extract tasks that are specific, actionable, and implementable
- Identify clear goals, target users, and project context
- Estimate effort in hours where possible (use reasonable estimates)
- Assign realistic priorities based on dependencies and importance
- Extract dependencies between tasks where mentioned
- Categorize documentation by type (goals, why, target_users, context, requirements, constraints)

Return your response as valid JSON with this EXACT structure (do not include markdown formatting):

{
  "tasks": [
    {
      "title": "Specific, actionable task title",
      "description": "Detailed description of what needs to be done",
      "priority": "high|medium|low",
      "estimatedHours": 8,
      "dependencies": ["titles of other tasks this depends on"],
      "tags": ["relevant", "tags", "for", "categorization"]
    }
  ],
  "documentation": [
    {
      "type": "goals|why|target_users|context|requirements|constraints",
      "title": "Documentation section title",
      "content": "Detailed content explaining this aspect",
      "importance": "high|medium|low"
    }
  ],
  "projectContext": {
    "projectName": "Extracted or inferred project name",
    "description": "Concise project overview",
    "targetUsers": ["user type 1", "user type 2"],
    "goals": ["primary goal 1", "primary goal 2"],
    "constraints": ["constraint 1", "constraint 2"]
  },
  "metadata": {
    "totalEstimatedHours": 40,
    "highPriorityTasks": 3,
    "complexityLevel": "medium|high|low",
    "suggestedTags": ["commonly", "used", "tags"]
  }
}

Focus on extracting actionable, specific tasks and comprehensive documentation. Be thorough but concise. Ensure all JSON is valid and properly formatted.
`;
  }

  /**
   * Test the connection to Anthropic API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.anthropicVersion
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ 
            role: 'user', 
            content: 'Test connection. Respond with just "OK".' 
          }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Anthropic API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Update the model for future requests
   */
  setModel(model: string): void {
    this.model = model;
  }
}