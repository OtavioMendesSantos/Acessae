'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StarRating } from './StarRating';
import { MessageSquare, Star } from 'lucide-react';

interface CriteriaAverage {
  name: string;
  average: number;
  count: number;
}

interface ReviewsSummaryProps {
  totalReviews: number;
  overallAverage: number;
  criteriaAverages: CriteriaAverage[];
  className?: string;
}

export function ReviewsSummary({ 
  totalReviews, 
  overallAverage, 
  criteriaAverages,
  className 
}: ReviewsSummaryProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-500';
    if (rating >= 3.5) return 'bg-yellow-500';
    if (rating >= 2.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excelente';
    if (rating >= 3.5) return 'Bom';
    if (rating >= 2.5) return 'Regular';
    if (rating >= 1.5) return 'Ruim';
    return 'Muito Ruim';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Resumo de Acessibilidade
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mensagem quando não há avaliações */}
        {totalReviews === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">Nenhuma avaliação</p>
            <p className="text-sm">Seja o primeiro a avaliar este local!</p>
          </div>
        ) : (
          /* Nota Geral em Destaque */
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Badge 
                className={`${getRatingColor(overallAverage)} text-white text-lg px-4 py-2`}
              >
                {overallAverage.toFixed(1)}
              </Badge>
              <span className="text-2xl font-bold text-gray-700">
                {getRatingText(overallAverage)}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <StarRating rating={overallAverage} readonly size="lg" />
              <span className="text-sm text-gray-600">
                ({totalReviews} avaliação{totalReviews !== 1 ? 'ões' : ''})
              </span>
            </div>
          </div>
        )}

        {/* Médias por Critério */}
        {totalReviews > 0 && criteriaAverages.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Avaliação por Critério</h4>
            
            <div className="space-y-3">
              {criteriaAverages.map((criteria) => (
                <div key={criteria.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      {criteria.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {criteria.average.toFixed(1)}
                      </span>
                      <StarRating 
                        rating={criteria.average} 
                        readonly 
                        size="sm" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={(criteria.average / 5) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{criteria.count} avaliação{criteria.count !== 1 ? 'ões' : ''}</span>
                      <span>{criteria.average.toFixed(1)}/5.0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
