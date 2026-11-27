using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using AileGaraj.Api.Services.Verification.Interfaces;
using AileGaraj.Api.Services.Verification.Options;

namespace AileGaraj.Api.Services.Verification.Senders;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;

    public SmtpEmailSender(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(
            _settings.SenderName,
            _settings.SenderEmail
        ));

        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        message.Body = new BodyBuilder
        {
            HtmlBody = htmlBody
        }.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(
            _settings.Host,
            _settings.Port,
            SecureSocketOptions.StartTls,
            cancellationToken
        );

        await client.AuthenticateAsync(
            _settings.UserName,
            _settings.Password,
            cancellationToken
        );

        var sendRequest = new SmtpSendRequest(message);

        await client.SendAsync(
            sendRequest,
            cancellationToken
        );

        await client.DisconnectAsync(true, cancellationToken);
    }
}