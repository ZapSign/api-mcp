import { discoverTools } from '../lib/tools.js';
import { logger } from '../lib/logger.js';

export function registerToolsCommand (program) {
  program
    .command('tools')
    .description('List all available API tools')
    .action(async () => {
      const tools = await discoverTools();
      if (tools.length === 0) {
        logger.info('No tools found. Tools should be organized as:');
        logger.info('tools/workspace/collection/request.js\n');
        return;
      }

      logger.info('\nAvailable Tools:\n');

      // Group tools by workspace/collection
      const groupedTools = tools.reduce((acc, tool) => {
        // Extract workspace and collection from path
        const parts = tool.path.split('/');
        const workspace = parts[1] || 'Unknown Workspace';
        const collection = parts[2] || 'Unknown Collection';

        if (!acc[workspace]) {acc[workspace] = {};}
        if (!acc[workspace][collection]) {acc[workspace][collection] = [];}

        acc[workspace][collection].push(tool);
        return acc;
      }, {});

      // Print tools in a hierarchical structure
      for (const [workspace, collections] of Object.entries(groupedTools)) {
        logger.info(`Workspace: ${workspace}`);
        for (const [collection, tools] of Object.entries(collections)) {
          logger.info(`  Collection: ${collection}`);
          tools.forEach(
            ({
              definition: {
                function: { name, description, parameters },
              },
            }) => {
              logger.info(`    ${name}`);
              logger.info(
                `      Description: ${description || 'No description provided'}`,
              );
              if (parameters && parameters.properties) {
                logger.info('      Parameters:');
                Object.entries(parameters.properties).forEach(
                  ([name, details]) => {
                    logger.info(
                      `        - ${name}: ${
                        details.description || 'No description'
                      }`,
                    );
                  },
                );
              }
              logger.info('');
            },
          );
        }
        logger.info('');
      }
    });
}
