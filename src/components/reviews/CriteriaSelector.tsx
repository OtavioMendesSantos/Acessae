'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from './StarRating';
import { ACCESSIBILITY_CRITERIA, type CriteriaData } from '@/lib/validations';

interface CriteriaSelectorProps {
  selectedCriteria: CriteriaData[];
  onCriteriaChange: (criteria: CriteriaData[]) => void;
  className?: string;
}

export function CriteriaSelector({ 
  selectedCriteria, 
  onCriteriaChange, 
  className 
}: CriteriaSelectorProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>('');

  const availableCriteria = ACCESSIBILITY_CRITERIA.filter(
    criterion => !selectedCriteria.some(c => c.name === criterion)
  );

  const addCriterion = () => {
    if (selectedCriterion && !selectedCriteria.some(c => c.name === selectedCriterion)) {
      const newCriterion: CriteriaData = {
        name: selectedCriterion as CriteriaData['name'],
        rating: 1
      };
      onCriteriaChange([...selectedCriteria, newCriterion]);
      setSelectedCriterion('');
    }
  };

  const removeCriterion = (criterionName: string) => {
    onCriteriaChange(selectedCriteria.filter(c => c.name !== criterionName));
  };

  const updateRating = (criterionName: string, rating: number) => {
    onCriteriaChange(
      selectedCriteria.map(c => 
        c.name === criterionName ? { ...c, rating } : c
      )
    );
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Selector para adicionar critérios */}
        <div className="flex gap-2">
          <Select value={selectedCriterion} onValueChange={setSelectedCriterion}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um critério de acessibilidade" />
            </SelectTrigger>
            <SelectContent>
              {availableCriteria.map((criterion) => (
                <SelectItem key={criterion} value={criterion}>
                  {criterion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            type="button"
            onClick={addCriterion}
            disabled={!selectedCriterion}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de critérios selecionados */}
        {selectedCriteria.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Critérios selecionados ({selectedCriteria.length}/5)
            </h4>
            
            <div className="space-y-2">
              {selectedCriteria.map((criterion) => (
                <div 
                  key={criterion.name}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-medium">
                      {criterion.name}
                    </Badge>
                    
                    <StarRating
                      rating={criterion.rating}
                      onRatingChange={(rating) => updateRating(criterion.name, rating)}
                      size="sm"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    onClick={() => removeCriterion(criterion.name)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCriteria.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Selecione pelo menos um critério para avaliar
          </p>
        )}
      </div>
    </div>
  );
}

