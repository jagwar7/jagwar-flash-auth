const password_reset_mail_object = {
  notificationType: "EMAIL",
  templateName: "PASSWORD_RESET",
  recipient: {
    email: "yourname@gmail.com",
    name: "name",
    phone: "+9162XXXXXX01"
  },
  payload: {
    payloadType: "password-reset",
    resetLink: ""
  }
}

module.exports = password_reset_mail_object;