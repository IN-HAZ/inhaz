<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class OtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected string $code,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('inHaz - Votre code de vérification')
            ->line('Votre code de vérification inHaz est :')
            ->line("**{$this->code}**")
            ->line('Ce code expire dans 5 minutes.')
            ->line('Si vous n\'avez pas demandé ce code, ignorez cet email.');
    }
}
