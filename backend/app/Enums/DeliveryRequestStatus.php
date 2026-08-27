<?php

namespace App\Enums;

enum DeliveryRequestStatus: string
{
    case Draft = 'DRAFT';
    case Open = 'OPEN';
    case Matched = 'MATCHED';
    case Completed = 'COMPLETED';
    case Cancelled = 'CANCELLED';
    case Expired = 'EXPIRED';
}
