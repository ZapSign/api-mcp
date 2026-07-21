import { toolPaths } from '../tools/paths.js';
import { logger } from './logger.js';

/**
 * Discovers and loads available tools from the tools directory
 * @returns {Array} Array of tool objects
 */
export function discoverTools () {
  try {
    const tools = [];
    for (const toolPath of toolPaths) {
      try {
        // Note: Dynamic imports are handled at runtime when tools are actually used
        // For now, we'll return the tool paths for discovery
        tools.push({
          name: toolPath.split('/').pop().replace('.js', ''),
          path: toolPath,
        });
      } catch (error) {
        logger.error(`Failed to load tool from ${toolPath}:`, error);
      }
    }
    return tools;
  } catch (error) {
    logger.error('Error discovering tools:', error);
    return [];
  }
}
