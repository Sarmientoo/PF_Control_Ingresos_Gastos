public class EmailService : IEmailService
{
    public async Task SendAsync(string to, string subject, string body)
    {
        var message = new MimeKit.MimeMessage();
        message.From.Add(new MimeKit.MailboxAddress("App", "noreply@tuapp.com"));
        message.To.Add(new MimeKit.MailboxAddress("", to));
        message.Subject = subject;
        message.Body = new MimeKit.TextPart("plain") { Text = body };

        using var client = new MailKit.Net.Smtp.SmtpClient();
        await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
        await client.AuthenticateAsync("exevazquez5@gmail.com", "qhdz qvxd pbkt vrsl");
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}