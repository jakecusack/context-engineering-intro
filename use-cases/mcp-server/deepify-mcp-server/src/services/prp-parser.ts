/**
 * PRP Parser Service
 * 
 * High-level service for parsing PRPs and managing the parsing workflow
 */

import { AnthropicClient } from './anthropic-client';
import { PRPParsingResult, ProjectContext, PRPParsingOptions } from '../types/prp-types';

export class PRPParserService {
  private anthropicClient: AnthropicClient;

  constructor(apiKey: string, model: string = 'claude-3-5-haiku-latest') {
    this.anthropicClient = new AnthropicClient(apiKey, model);
  }

  /**
   * Parse a PRP with comprehensive error handling and validation
   */
  async parsePRP(
    prpContent: string, 
    options: PRPParsingOptions = {}
  ): Promise<PRPParsingResult> {
    // Validate input
    if (!prpContent || typeof prpContent !== 'string') {
      throw new Error('PRP content must be a non-empty string');
    }

    const trimmedContent = prpContent.trim();
    if (trimmedContent.length < 10) {
      throw new Error('PRP content must be at least 10 characters long');
    }

    if (trimmedContent.length > 100000) {
      throw new Error('PRP content is too long (maximum 100,000 characters)');
    }

    try {
      // Parse using Anthropic
      const result = await this.anthropicClient.parsePRP(trimmedContent, options.projectContext);

      // Post-process and validate the result
      const validatedResult = this.validateAndEnhanceResult(result, options);

      return validatedResult;
    } catch (error) {
      console.error('PRP parsing failed:', error);
      throw new Error(`PRP parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate and enhance the parsing result
   */
  private validateAndEnhanceResult(
    result: PRPParsingResult, 
    options: PRPParsingOptions
  ): PRPParsingResult {
    // Ensure all tasks have required fields
    const enhancedTasks = result.tasks.map(task => ({
      ...task,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
      estimatedHours: this.validateEstimatedHours(task.estimatedHours),
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      tags: Array.isArray(task.tags) ? task.tags : []
    }));

    // Ensure all documentation has required fields
    const enhancedDocumentation = result.documentation.map(doc => ({
      ...doc,
      type: this.validateDocumentationType(doc.type),
      title: doc.title || 'Untitled Documentation',
      content: doc.content || '',
      importance: ['low', 'medium', 'high'].includes(doc.importance) ? doc.importance : 'medium'
    }));

    // Enhance project context
    const enhancedProjectContext: ProjectContext = {
      projectName: result.projectContext.projectName || options.projectContext?.projectName || 'Unnamed Project',
      description: result.projectContext.description || '',
      targetUsers: Array.isArray(result.projectContext.targetUsers) ? result.projectContext.targetUsers : [],
      goals: Array.isArray(result.projectContext.goals) ? result.projectContext.goals : [],
      constraints: Array.isArray(result.projectContext.constraints) ? result.projectContext.constraints : []
    };

    // Calculate metadata
    const metadata = {
      totalEstimatedHours: enhancedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      highPriorityTasks: enhancedTasks.filter(task => task.priority === 'high').length,
      complexityLevel: this.calculateComplexityLevel(enhancedTasks),
      suggestedTags: this.extractSuggestedTags(enhancedTasks, enhancedDocumentation),
      parsingTimestamp: new Date().toISOString(),
      taskCount: enhancedTasks.length,
      documentationCount: enhancedDocumentation.length
    };

    return {
      tasks: enhancedTasks,
      documentation: enhancedDocumentation.map(doc => ({
        ...doc,
        type: doc.type as 'goals' | 'why' | 'target_users' | 'context' | 'requirements' | 'constraints'
      })),
      projectContext: enhancedProjectContext,
      metadata
    };
  }

  /**
   * Validate estimated hours
   */
  private validateEstimatedHours(hours: any): number {
    if (typeof hours === 'number' && hours > 0 && hours <= 1000) {
      return Math.round(hours);
    }
    return 0; // Default to 0 if invalid
  }

  /**
   * Validate documentation type
   */
  private validateDocumentationType(type: any): string {
    const validTypes = ['goals', 'why', 'target_users', 'context', 'requirements', 'constraints'];
    return validTypes.includes(type) ? type : 'context';
  }

  /**
   * Calculate complexity level based on tasks
   */
  private calculateComplexityLevel(tasks: any[]): 'low' | 'medium' | 'high' {
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const highPriorityCount = tasks.filter(task => task.priority === 'high').length;
    const taskCount = tasks.length;

    if (totalHours > 100 || highPriorityCount > 5 || taskCount > 20) {
      return 'high';
    } else if (totalHours > 40 || highPriorityCount > 2 || taskCount > 10) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Extract suggested tags from tasks and documentation
   */
  private extractSuggestedTags(tasks: any[], documentation: any[]): string[] {
    const allTags = new Set<string>();

    // Collect tags from tasks
    tasks.forEach(task => {
      if (Array.isArray(task.tags)) {
        task.tags.forEach((tag: string) => allTags.add(tag.toLowerCase()));
      }
    });

    // Add common tags based on content analysis
    const commonTags = [
      'frontend', 'backend', 'database', 'testing', 'deployment',
      'documentation', 'research', 'design', 'api', 'security'
    ];

    // Add relevant common tags
    const content = tasks.map(t => `${t.title} ${t.description}`).join(' ').toLowerCase();
    commonTags.forEach(tag => {
      if (content.includes(tag)) {
        allTags.add(tag);
      }
    });

    return Array.from(allTags).slice(0, 10); // Limit to 10 suggested tags
  }

  /**
   * Test the parser service
   */
  async testConnection(): Promise<boolean> {
    return await this.anthropicClient.testConnection();
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.anthropicClient.getModel();
  }

  /**
   * Set model for future parsing
   */
  setModel(model: string): void {
    this.anthropicClient.setModel(model);
  }
}