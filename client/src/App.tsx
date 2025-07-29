
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Counter } from '../../server/src/schema';

function App() {
  const [counter, setCounter] = useState<Counter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIncrementing, setIsIncrementing] = useState(false);

  // Load counter data
  const loadCounter = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getCounter.query();
      setCounter(result);
    } catch (error) {
      console.error('Failed to load counter:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load counter on mount
  useEffect(() => {
    loadCounter();
  }, [loadCounter]);

  const handleIncrement = async () => {
    setIsIncrementing(true);
    try {
      const result = await trpc.incrementCounter.mutate({ increment: 1 });
      setCounter(result);
    } catch (error) {
      console.error('Failed to increment counter:', error);
    } finally {
      setIsIncrementing(false);
    }
  };

  if (isLoading || !counter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading counter...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-96 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            🔢 Counter App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Counter Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {counter.count}
            </div>
            <div className="text-sm text-gray-500">
              Current Count
            </div>
          </div>

          {/* Increment Button */}
          <div className="text-center">
            <Button 
              onClick={handleIncrement}
              disabled={isIncrementing}
              size="lg"
              className="px-8 py-3 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isIncrementing ? (
                <span className="flex items-center gap-2">
                  ⏳ Incrementing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ➕ Increment
                </span>
              )}
            </Button>
          </div>

          {/* Last Updated */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t">
            Last updated: {counter.updated_at.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
