const welcome_mail_object = {
  notificationType: "EMAIL",        // DONT CHANGE
  templateName: "WELCOME_EMAIL",    // DONT CHANGE
  recipient: {
    email: "your email",        
    name: "Jagwar",
    phone: "your number"
  },
  payload: {
    payloadType: "welcome",         // DONT CHANGE
    userName: "Jagwar",
    welcomeLink: "http://link.com"
  }
}

export default welcome_mail_object;