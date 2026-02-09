// Used for Email templates
import Mailgen from "mailgen";

// Used for sending emails
import nodeMailer from "nodemailer"

const sendEmail = async (options)=>{
  const emailGenerator = new Mailgen({
        theme: "default",
        product:{
            name: "Task Manager",
            link:"https://taskmanagelink.com"
        }
    })

   const emailTextual =  emailGenerator.generatePlaintext(options.mailgenContent)
   const emailHtml =  emailGenerator.generate(options.mailgenContent)

   const transpoter = nodeMailer.createTransport({
    host:process.env.MAILTRAP_SMTP_HOST,
    port:process.env.MAILTRAP_SMTP_PORT,
    auth:{
        user:process.env.MAILTRAP_SMTP_USER,
        pass:process.env.MAILTRAP_SMTP_PASS
    }
   })

   const mail = {
    from:"mail.taskmanger@example.com",
    to:options.email,
    subject: options.subject,
    text:emailTextual,
    html:emailHtml
   }

   try {
    await transpoter.sendMail(mail)
   } catch (error) {
        console.error("Email service faailed siliently, this might have happen because of credentials");
        console.error("Error",error);    
   }
}

const emailVerificationMail = (username,verficationUrl)=>{
    return{
        body:{
            name:username,
            intro:"Welcom to our app! we're excited to have you on board",
            action:{
                instruction:"to verify your email please",
                button:{
                    color:"#22BC66",
                    text: "Verify your email",
                    link: verficationUrl
                }
            },
            outro: "Need help, or have questions? just reply to this email, we'd love to help"
        }
    }
};

const forgotPasswordMail = (username,passwordResetUrl)=>{
    return{
        body:{
            name:username,
            intro:"We got a request to reset the password of your",
            action:{
                instruction:"to reset your password click on the following button or link",
                button:{
                    color:"#22bc66ff",
                    text: "Reset password",
                    link: passwordResetUrl
                }
            },
            outro: "Need help, or have questions? just reply to this email, we'd love to help"
        },
    }
};

export{
    emailVerificationMail,
    forgotPasswordMail,
    sendEmail
}