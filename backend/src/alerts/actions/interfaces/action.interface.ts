export interface Action {
  /**
   * Execute the action for an alert
   * @param alert The alert to perform the action on
   * @param config Configuration for the action
   * @returns Result of the action execution
   */
  execute(alert: any, config?: any): Promise<any>;
  
  /**
   * Get metadata describing the action
   * @returns Action metadata
   */
  getMetadata(): ActionMetadata;
}

export interface ActionMetadata {
  /**
   * Display name of the action
   */
  name: string;
  
  /**
   * Description of what the action does
   */
  description: string;
  
  /**
   * Configuration schema for the action
   */
  configSchema: any;
  
  /**
   * Whether the action is enabled
   */
  enabled: boolean;
  
  /**
   * Roles that can use this action
   */
  allowedRoles?: string[];
  
  /**
   * Icon for the action
   */
  icon?: string;
}

export interface ActionResult {
  /**
   * Whether the action was successful
   */
  success: boolean;
  
  /**
   * Action type
   */
  type: string;
  
  /**
   * Alert ID
   */
  alertId: string;
  
  /**
   * Result data
   */
  data?: any;
  
  /**
   * Error message if not successful
   */
  error?: string;
  
  /**
   * Timestamp of execution
   */
  timestamp: Date;
}