// yardim yardim
// this code is not stolen lololol
// end my life please

// ~ by August ~
// ~ by ibx34 ~
// https://arcanebot.xyz/invite - https://arcanebot.xyz/premium


// hi yes this is an ad to my bot
const {            get            } = require ( '@augu/orchid' );
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
                      .connect ( ) ;

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
                 // Ayo. Join my minecraft server. We got big booty bitches and the edgiest blocks around. You like bloccy tits? I gotcha. 
                reply( 
                  
                  {

                            embed: {

                                    image: 
                                    
                          {


                                  url: 'https://cdn.floofy.dev/images/banner.gif'

                                  },


                      description: 'i fucked your mom lol\n\n\n\nyardim yardim `!help` `!ping` `!yiff`\n\n\n\nit reac to `bot bad` !!!!!!'

                    }

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


            const { 


              isWebUri 
            
            
            
            }

                  = require ( 'valid-url' );




                        yardim

              .on     (


                'messageUpdate',


                          event => 
                          
                          
                                  {

                            if (


                              /^(http|https):\/\//.test(


                                  event.
                                  
                                        message
                                        
                                .content

                              )

                      ) 
                      
                            {

                  event
                  
                                  .message

                        .channel

              .send (
                
                
          {

                content: `<@${event.message.author.id}> sa sa sa sa sa `,

                mentions: { users: [event.message.author.id] }
              }
              
      )
                           
                  }
                            
                                  
                        }
              )


                        yardim

              .on 


              (

                'message',

                    async event => {


                    

                if (event.message.content.includes('hug')) 
                
                
                {



                  const res = await get('https://some-random-api.ml/animu/hug');

                  const d = res               . json (


                  );

                  return event
                      .channel
                          .send(

                            {

                              content: d.link
                }
                          )

                        }


          }

              )


          const {


            readFileSync:

        readYourCum
} = require(

'fs'

);


        yardim

  .

          on(



            'message',



                    event => 
                    
        {


                    if (

            event.message.content === '!bal' || event.message.content === '!balance'
            
                    ) {
                      {
                        {
                          {
                            {
                              {
                                {
                                  {
                                    {


                                        for (

                                          let cum = 0;

                                          cum < 10;

                                          cum++
                                        ) {{{{{{{{{{{{{



                                          readYourCum('./config.json');


                                        }}}}}}}}}}}}}



                      return event

              .channel


                                            .send(`
                                            
                                            
                                            
      your diamonds are :diamond: **10** lololol
                                            
                                            
                                            `);



                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }

}
          )
