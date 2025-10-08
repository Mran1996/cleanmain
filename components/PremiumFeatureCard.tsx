import { Logo } from './Logo';
import { CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PremiumFeatureCardProps {
  title?: string;
  message?: string;
  onViewPricing?: () => void;
  onGoBack?: () => void;
}

export function PremiumFeatureCard({ 
  title = "AI Legal Assistant - Premium Feature",
  message = "Access to the AI legal assistant requires an active subscription. This interactive chat helps gather information for your legal case and generates professional legal documents.",
  onViewPricing,
  onGoBack
}: PremiumFeatureCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <div className="mb-6">
            <Logo size="lg" />
          </div>
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600 text-lg leading-relaxed">
            {message}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={onViewPricing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              View Pricing Plans
            </Button>
            <Button 
              variant="outline"
              onClick={onGoBack}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-lg"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
