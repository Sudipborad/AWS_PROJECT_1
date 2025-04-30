import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Mail, BarChart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfficerCardProps {
  id: string;
  name: string;
  email: string;
  area: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  className?: string;
}

const OfficerCard: React.FC<OfficerCardProps> = ({
  id,
  name,
  email,
  area,
  status,
  imageUrl,
  className,
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{name}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-1 h-3.5 w-3.5" />
                <span>{email}</span>
              </div>
            </div>
          </div>
          <Badge 
            variant={status === 'active' ? "default" : "secondary"}
            className={cn(
              status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            )}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Area: {area || 'Unassigned'}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/officer-profile/${id}`}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/officer-report/${id}`}>
            <BarChart className="mr-2 h-4 w-4" />
            Performance
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OfficerCard; 