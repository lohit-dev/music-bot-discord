module.exports = {
    // Helper function to send a message that auto-deletes after a specified time
    autoDeleteMessage: async (message, content, deleteAfter = 60000) => {
        try {
            // Input validation
            if (!message) {
                console.error('No message object provided to autoDeleteMessage');
                return null;
            }

            if (!content) {
                console.error('No content provided to autoDeleteMessage');
                return null;
            }

            let sentMessage;

            try {
                // If message is a proper Discord.js Message object with reply method
                if (message.reply && typeof message.reply === 'function') {
                    sentMessage = await message.reply(content);
                }
                // If message has a channel property
                else if (message.channel && typeof message.channel.send === 'function') {
                    sentMessage = await message.channel.send(content);
                }
                // If message is a channel itself
                else if (typeof message.send === 'function') {
                    sentMessage = await message.send(content);
                }
                else {
                    throw new Error('Invalid message object provided');
                }

                // Set up auto-delete
                if (sentMessage && deleteAfter > 0) {
                    setTimeout(() => {
                        if (sentMessage.deletable) {
                            sentMessage.delete().catch(error => {
                                if (error.code !== 10008) { // Ignore "Unknown Message" errors
                                    console.error('Error deleting message:', error);
                                }
                            });
                        }
                    }, deleteAfter);
                }

                return sentMessage;
            } catch (sendError) {
                console.error('Error sending message:', sendError);
                return null;
            }
        } catch (error) {
            console.error('Error in autoDeleteMessage:', error);
            return null;
        }
    }
};