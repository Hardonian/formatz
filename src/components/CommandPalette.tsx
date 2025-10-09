import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, DocumentTextIcon, ClockIcon, BookmarkIcon, PhotoIcon, UserIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Command {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  category: 'navigation' | 'action';
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands: Command[] = [
    {
      id: 'convert',
      name: 'New Conversion',
      description: 'Start a new data conversion',
      icon: DocumentTextIcon,
      category: 'navigation',
      action: () => navigate('/convert'),
    },
    {
      id: 'templates',
      name: 'Browse Templates',
      description: 'View conversion templates',
      icon: BookmarkIcon,
      category: 'navigation',
      action: () => navigate('/templates'),
    },
    {
      id: 'history',
      name: 'Conversion History',
      description: 'View past conversions',
      icon: ClockIcon,
      category: 'navigation',
      action: () => navigate('/history'),
    },
    {
      id: 'gallery',
      name: 'Public Gallery',
      description: 'Browse community templates',
      icon: PhotoIcon,
      category: 'navigation',
      action: () => navigate('/gallery'),
    },
    {
      id: 'profile',
      name: 'Profile Settings',
      description: 'Manage your profile',
      icon: UserIcon,
      category: 'navigation',
      action: () => navigate('/profile'),
    },
  ];

  const filteredCommands = query === ''
    ? commands
    : commands.filter((command) =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleShowCommandPalette = () => {
      setIsOpen(true);
    };

    window.addEventListener('show-command-palette', handleShowCommandPalette);
    return () => window.removeEventListener('show-command-palette', handleShowCommandPalette);
  }, []);

  const handleSelect = (command: Command | null) => {
    if (!command) return;
    command.action();
    setIsOpen(false);
    setQuery('');
  };

  return (
    <Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <Combobox onChange={handleSelect}>
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search commands..."
                    onChange={(event) => setQuery(event.target.value)}
                    value={query}
                  />
                </div>

                {filteredCommands.length > 0 && (
                  <Combobox.Options static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                    {filteredCommands.map((command) => (
                      <Combobox.Option
                        key={command.id}
                        value={command}
                        className={({ active }) =>
                          `flex cursor-pointer select-none items-center rounded-md px-3 py-2 ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                      >
                        {({ active }) => (
                          <>
                            <command.icon
                              className={`h-6 w-6 flex-none ${
                                active ? 'text-white' : 'text-gray-400'
                              }`}
                              aria-hidden="true"
                            />
                            <div className="ml-3 flex-auto">
                              <p className={`text-sm font-medium ${active ? 'text-white' : ''}`}>
                                {command.name}
                              </p>
                              <p
                                className={`text-sm ${
                                  active ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {command.description}
                              </p>
                            </div>
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}

                {query !== '' && filteredCommands.length === 0 && (
                  <div className="px-6 py-14 text-center text-sm sm:px-14">
                    <MagnifyingGlassIcon className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                    <p className="mt-4 font-semibold text-gray-900 dark:text-gray-100">No results found</p>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      No commands found for "{query}". Try a different search.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white dark:bg-gray-800 font-semibold sm:mx-2">
                    ↓↑
                  </kbd>
                  to navigate
                  <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white dark:bg-gray-800 font-semibold sm:mx-2">
                    ↵
                  </kbd>
                  to select
                  <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white dark:bg-gray-800 font-semibold sm:mx-2">
                    Esc
                  </kbd>
                  to close
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
