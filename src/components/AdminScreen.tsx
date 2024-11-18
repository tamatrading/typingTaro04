import React, { useState } from 'react';
import { Settings, ArrowLeft, Check } from 'lucide-react';

interface AdminScreenProps {
  onBack: () => void;
  onSettingsChange: (settings: { selectedStages: number[]; speed: number }) => void;
  currentSettings: {
    selectedStages: number[];
    speed: number;
  };
}

const AdminScreen: React.FC<AdminScreenProps> = ({
  onBack,
  onSettingsChange,
  currentSettings,
}) => {
  const [speed, setSpeed] = useState(currentSettings.speed);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'wa']);

  const stageGroups = [
    { id: 'a', label: 'あ行', stages: [2] },
    { id: 'ka', label: 'か行', stages: [3] },
    { id: 'sa', label: 'さ行', stages: [4] },
    { id: 'ta', label: 'た行', stages: [5] },
    { id: 'na', label: 'な行', stages: [6] },
    { id: 'ha', label: 'は行', stages: [7] },
    { id: 'ma', label: 'ま行', stages: [8] },
    { id: 'ya', label: 'や行', stages: [9] },
    { id: 'wa', label: 'わ行', stages: [10] },
    { id: 'basic', label: 'F/J練習', stages: [1] },
  ];

  const toggleStageGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      const newSelection = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];
      
      // Calculate new stages based on selected groups
      const newStages = Array.from(
        new Set(
          newSelection.flatMap((id) => 
            stageGroups.find(group => group.id === id)?.stages || []
          )
        )
      ).sort((a, b) => a - b);

      // Update parent component with new settings
      onSettingsChange({ selectedStages: newStages, speed });
      
      return newSelection;
    });
  };

  const selectAll = () => {
    const allGroups = stageGroups.map(g => g.id);
    setSelectedGroups(allGroups);
    const allStages = Array.from(
      new Set(stageGroups.flatMap(group => group.stages))
    ).sort((a, b) => a - b);
    onSettingsChange({ selectedStages: allStages, speed });
  };

  const clearAll = () => {
    setSelectedGroups([]);
    onSettingsChange({ selectedStages: [], speed });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    const currentStages = Array.from(
      new Set(
        selectedGroups.flatMap((id) => 
          stageGroups.find(group => group.id === id)?.stages || []
        )
      )
    ).sort((a, b) => a - b);
    onSettingsChange({ selectedStages: currentStages, speed: newSpeed });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="mr-2" />
            戻る
          </button>
          <h2 className="text-2xl font-bold flex items-center">
            <Settings className="mr-2" />
            管理画面
          </h2>
          <div className="w-[72px]"></div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">実施ステージ選択</h3>
              <div className="space-x-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  すべて選択
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1 text-sm rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  選択解除
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {stageGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleStageGroup(group.id)}
                  className={`p-3 rounded-lg border-2 transition-all relative ${
                    selectedGroups.includes(group.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {selectedGroups.includes(group.id) && (
                    <Check className="absolute top-1 right-1 w-4 h-4 text-blue-500" />
                  )}
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">落下速度調整</h3>
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleSpeedChange(value)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    speed === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">現在の設定</h4>
            <p className="mb-1">
              選択された行: {selectedGroups.length === 0 
                ? "なし" 
                : stageGroups
                    .filter(group => selectedGroups.includes(group.id))
                    .map(group => group.label)
                    .join(', ')
              }
            </p>
            <p>落下速度: {speed}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;