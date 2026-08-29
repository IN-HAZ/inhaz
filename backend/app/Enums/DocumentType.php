<?php

namespace App\Enums;

enum DocumentType: string
{
    case Cin = 'CIN';
    case Registration = 'REGISTRATION';
    case Insurance = 'INSURANCE';
    case DrivingLicense = 'DRIVING_LICENSE';
}
