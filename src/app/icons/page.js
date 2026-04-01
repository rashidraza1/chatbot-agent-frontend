'use client';
import BotIcon from '@/components/icons/BotIcon';
import HistoryIcon from '@/components/icons/HistoryIcon';
import BotFuturisticIcon from '@/components/icons/BotFuturisticIcon';
import BotRoundIcon from '@/components/icons/BotRoundIcon';
import BotMagicIcon from '@/components/icons/BotMagicIcon';
import BrainTechIcon from '@/components/icons/BrainTechIcon';
import SparkIcon from '@/components/icons/SparkIcon';
import ClockDigitalIcon from '@/components/icons/ClockDigitalIcon';
import HistoryNeonIcon from '@/components/icons/HistoryNeonIcon';
import HistoryFolderIcon from '@/components/icons/HistoryFolderIcon';
import ArchiveIcon from '@/components/icons/ArchiveIcon';
import FunkyChatIcon from '@/components/icons/FunkyChatIcon';
import SearchFunkyIcon from '@/components/icons/SearchFunkyIcon';
import TrashFunkyIcon from '@/components/icons/TrashFunkyIcon';
import PlusFunkyIcon from '@/components/icons/PlusFunkyIcon';
import SendFunkyIcon from '@/components/icons/SendFunkyIcon';
import SettingsFunkyIcon from '@/components/icons/SettingsFunkyIcon';
import MicFunkyIcon from '@/components/icons/MicFunkyIcon';
import MaximizeFunkyIcon from '@/components/icons/MaximizeFunkyIcon';
import UserFunkyIcon from '@/components/icons/UserFunkyIcon';
import BotThinkingIcon from '@/components/icons/BotThinkingIcon';
import BotShieldIcon from '@/components/icons/BotShieldIcon';
import BotHappyIcon from '@/components/icons/BotHappyIcon';
import BotHeadsetIcon from '@/components/icons/BotHeadsetIcon';
import BotGlitchIcon from '@/components/icons/BotGlitchIcon';
import HistoryRewindIcon from '@/components/icons/HistoryRewindIcon';
import HistoryBookIcon from '@/components/icons/HistoryBookIcon';
import HistoryListIcon from '@/components/icons/HistoryListIcon';
import HistoryGraphIcon from '@/components/icons/HistoryGraphIcon';
import HistoryInfinityIcon from '@/components/icons/HistoryInfinityIcon';

const icons = [
  // 🤖 Chatbot Icons
  { name: 'BotIcon', component: BotIcon, type: 'Chatbot' },
  { name: 'BotFuturisticIcon', component: BotFuturisticIcon, type: 'Chatbot' },
  { name: 'BotRoundIcon', component: BotRoundIcon, type: 'Chatbot' },
  { name: 'BotMagicIcon', component: BotMagicIcon, type: 'Chatbot' },
  { name: 'BotThinkingIcon', component: BotThinkingIcon, type: 'Chatbot' },
  { name: 'BotShieldIcon', component: BotShieldIcon, type: 'Chatbot' },
  { name: 'BotHappyIcon', component: BotHappyIcon, type: 'Chatbot' },
  { name: 'BotHeadsetIcon', component: BotHeadsetIcon, type: 'Chatbot' },
  { name: 'BotGlitchIcon', component: BotGlitchIcon, type: 'Chatbot' },

  // 📜 History Icons
  { name: 'HistoryIcon', component: HistoryIcon, type: 'Time' },
  { name: 'HistoryNeonIcon', component: HistoryNeonIcon, type: 'Time' },
  { name: 'ClockDigitalIcon', component: ClockDigitalIcon, type: 'Time' },
  { name: 'HistoryFolderIcon', component: HistoryFolderIcon, type: 'Time' },
  { name: 'ArchiveIcon', component: ArchiveIcon, type: 'Archive' },
  { name: 'HistoryRewindIcon', component: HistoryRewindIcon, type: 'Time' },
  { name: 'HistoryBookIcon', component: HistoryBookIcon, type: 'Time' },
  { name: 'HistoryListIcon', component: HistoryListIcon, type: 'Time' },
  { name: 'HistoryGraphIcon', component: HistoryGraphIcon, type: 'Time' },
  { name: 'HistoryInfinityIcon', component: HistoryInfinityIcon, type: 'Time' },

  // ✨ Other Icons
  { name: 'BrainTechIcon', component: BrainTechIcon, type: 'AI' },
  { name: 'SparkIcon', component: SparkIcon, type: 'AI' },
  { name: 'FunkyChatIcon', component: FunkyChatIcon, type: 'UI' },
  { name: 'SearchFunkyIcon', component: SearchFunkyIcon, type: 'Action' },
  { name: 'TrashFunkyIcon', component: TrashFunkyIcon, type: 'Action' },
  { name: 'PlusFunkyIcon', component: PlusFunkyIcon, type: 'Action' },
  { name: 'SendFunkyIcon', component: SendFunkyIcon, type: 'Action' },
  { name: 'SettingsFunkyIcon', component: SettingsFunkyIcon, type: 'Interface' },
  { name: 'MicFunkyIcon', component: MicFunkyIcon, type: 'Input' },
  { name: 'MaximizeFunkyIcon', component: MaximizeFunkyIcon, type: 'Window' },
  { name: 'UserFunkyIcon', component: UserFunkyIcon, type: 'Profile' },
];

export default function IconLibrary() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-gray-950 p-8 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Funky Icon Library
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            A premium collection of custom SVG icons for your chatbot widget.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {icons.map((item) => (
            <div 
              key={item.name}
              className="group bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-24 flex items-center justify-center mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group-hover:scale-105 transition-transform">
                <item.component size={48} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500/60 dark:text-indigo-400/50">
                  {item.type}
                </p>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                  {item.name}
                </h3>
                <div 
                  className="pt-4 flex items-center justify-between pointer-events-none opacity-40 text-[10px] uppercase font-mono tracking-tighter text-gray-400"
                >
                  <span>Reusable React Comp.</span>
                  <span>SVG Path</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400 text-center">
            Icons support <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-indigo-500">size</code> and <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-indigo-500">className</code> props.
          </p>
        </footer>
      </div>
    </div>
  );
}
