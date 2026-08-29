<?php

namespace App\Enums;

enum OfferStatus: string
{
    case Pending = 'PENDING';
    case Accepted = 'ACCEPTED';
    case Rejected = 'REJECTED';
    case Withdrawn = 'WITHDRAWN';
    case Expired = 'EXPIRED';
}
