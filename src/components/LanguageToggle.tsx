import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const LanguageToggle = ({ variant = 'icon' }: { variant?: 'icon' | 'inline' }) => {
  const { i18n, t } = useTranslation();
  const change = (lng: 'en' | 'ru') => i18n.changeLanguage(lng);
  const current = i18n.resolvedLanguage === 'ru' ? 'RU' : 'EN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'icon' ? 'ghost' : 'outline'}
          size={variant === 'icon' ? 'icon' : 'sm'}
          className={variant === 'icon' ? '' : 'gap-2'}
          aria-label={t('lang.label')}
        >
          <Globe className="h-4 w-4" />
          {variant === 'inline' && <span className="text-xs font-semibold">{current}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change('en')}>
          🇬🇧 {t('lang.en')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change('ru')}>
          🇷🇺 {t('lang.ru')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
