import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useThemeStore } from '@/stores/theme.store';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useThemeStore();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: SunIcon },
    { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
    { value: 'system' as const, label: 'System', icon: ComputerDesktopIcon },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus-ring transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-5 w-5" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-1">
            {themes.map(({ value, label, icon: Icon }) => (
              <Menu.Item key={value}>
                {({ active }) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme(value)}
                    className={`
                      ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                      ${theme === value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-gray-100'}
                      group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left">{label}</span>
                    {theme === value && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 text-blue-600 dark:text-blue-400"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
