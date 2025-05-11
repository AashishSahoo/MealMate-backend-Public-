const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendRejectionEmail = async (
  toEmail,
  firstName,
  lastName,
  restaurantName,
  feedback
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Restaurant Application Rejected",
    html: `
      <p>Dear ${firstName} ${lastName},</p>
      <p>We regret to inform you that your restaurant ${restaurantName} has not been approved.</p>
      <p><strong>Feedback:</strong></p>
      <p>${feedback}</p>
      <p>Please correct the issues and resubmit your application.</p>
      <p>Best regards,<br>The MealMate Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendApprovalEmail = async (
  toEmail,
  firstName,
  lastName,
  restaurantName
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Restaurant Application Approved!",
    html: `
      <p>Congratulations ${firstName} ${lastName}!</p>
      <p>Your restaurant ${restaurantName} has been approved and is now live on our platform.</p>
      <p>Thank you for choosing MealMate as your partner in growth. We’re excited to see your restaurant thrive on our platform!</p>
      <p>Best regards,<br>The MealMate Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
