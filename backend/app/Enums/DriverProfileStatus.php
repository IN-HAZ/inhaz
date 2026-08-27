<?php

namespace App\Enums;

enum DriverProfileStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
}
