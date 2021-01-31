// yardim yardim
// this code is not stolen lololol
// end my life please

// ~ by August ~

const { token } = require('./config.json');
const { Client } = require('wumpcord');

const yardim = new Client({
            token,
                  ws: {
                            intents: ['guilds', 'guildMessages']
  }
});

yardim






  .on('ready', () => {
                console.log('bot is ready lol');
                                        yardim.setStatus('online', {
type: 2,
              name: 'sa uwu'
                                                                      });
});

                                yardim
.on('message',
  event =>

                            {
                                            if (event.message.content === 'bot bad' || event.message.content === 'bad bot lol') 
                                            
                                            {

                                              event.channel.send('@everyone YARIDMAS ISDBFHYIFGU', { mentions: { everyone: true } });

                                                          }
                                      }
);

yardim                                .connect();
