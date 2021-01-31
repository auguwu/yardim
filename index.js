// yardim yardim
// this code is not stolen lololol
// end my life please

// ~ by August ~
const {            get            } = require ( '@augu/orchid' );
const { token } = require('./config.json');
const { Client } = require('wumpcord');

const yardim = new Client({
            token,
                  ws: {
                            intents: ['guilds', 'guildMessages']
  }
});

yardim
                      .connect ( ) ;

yardim






  .on('ready', () => {
                console.log('sa');
                                        yardim.setStatus('online', {
type: 2,
              name: 'sa uwu'
                                                                      });
})

                                yardim
.on('message',
  event =>

                            {
                                            if (event.message.content === 'bot bad' || event.message.content === 'bad bot lol') 
                                            
                                            {

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

            .send(`sa ${token} yardim yaridm`);

            }
                        
          )

                                                                                                                                                    // use nino lol (https://nino.augu.dev <3)



























yardim . on ( 'message', event => { 


          if (
            
            
                event.message.content === '!help'
                
                
                
          )        {

            // humanity is fucked when March 24th, 2004 at ??:?? - a fellow
            // soon-to-be gay ass motherfucking furry appears in the real world

                    event

            .

                  message

            
                  .
                  
                reply( 
                  
                  {

                    content: 'fuck fuck fuck fuck it does `!help` `!yiff` `!ping`\n\n\n\n\n\n\n it also reacts to `bot bad` or `bad bot lol`!!!!!!!!!!!!!!!!'

                  } 
                  
                  
              )

              
          }

} )




yardim

      . on ( 'message', async event =>      { 

          if (event.message.content === '!yiff') 
          
          
                  {

/*                          if (
                            
                                    !   event
                                    
                                          .channel.
                                          
                                  nsfw
                                  
                            ) return event
                              
                                      .message
                                      
                                  .reply( 'BONK NO HORNY SA SA SA SA' 
                                  
                          );
*/

                      const res = await get(
                        
                        
                                'https://api.floofy.dev/yiff'
                                
                                
                      );

                      const d = res.json(    );


                      return event

                      .               message

                            . reply ( { 

                                        embed: {

                                          color: 0x696969,


                                      image : {


                                url: d.url


                        }
                                }
                            
                            } )

                  }


      }
      
      
  )
