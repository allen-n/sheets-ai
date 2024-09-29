export interface Tool {
  name: string;
  description: string;
  parameters: any; // JSON schema for parameters
  execute(args: any): Promise<any>;
}

/**
 * Interface for tools that can be used to generate async messages
 */
export interface AsyncMessageTool extends Tool {
  /**
   * Function to be called after the tool has been executed
   * @param args The arguments to be passed to the tool
   */
  postExecute(args: any): Promise<void>;
  /**
   * The sync call to execute the tool initially
   * @param args The arguments to be passed to the tool
   */
  execute(args: any): Promise<{ result_message: string }>;
}

export interface ImageGeneratorTool extends AsyncMessageTool {
  execute(args: any): Promise<{ result_message: string }>;
}
