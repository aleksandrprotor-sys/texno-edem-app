// js/config.js - Добавляем расширенные настройки темы
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            // ... существующие настройки ...
            
            THEMES: {
                light: {
                    '--primary': '#2C3E50',
                    '--primary-dark': '#1a252f',
                    '--secondary': '#3498DB',
                    '--accent': '#E74C3C',
                    '--success': '#27AE60',
                    '--warning': '#F39C12',
                    '--danger': '#E74C3C',
                    '--info': '#3498DB',
                    '--white': '#ffffff',
                    '--gray-50': '#f8f9fa',
                    '--gray-100': '#f1f3f4',
                    '--gray-200': '#e8eaed',
                    '--gray-300': '#dadce0',
                    '--gray-400': '#bdc1c6',
                    '--gray-500': '#9aa0a6',
                    '--gray-600': '#80868b',
                    '--gray-700': '#5f6368',
                    '--gray-800': '#3c4043',
                    '--gray-900': '#202124',
                    '--cdek-primary': '#FF6B35',
                    '--cdek-secondary': '#FF8E53',
                    '--megamarket-primary': '#2980B9',
                    '--megamarket-secondary': '#3498DB',
                    '--shadow': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    '--shadow-md': '0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
                    '--shadow-lg': '0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)'
                },
                dark: {
                    '--primary': '#3498DB',
                    '--primary-dark': '#2980B9',
                    '--secondary': '#2C3E50',
                    '--accent': '#E74C3C',
                    '--success': '#27AE60',
                    '--warning': '#F39C12',
                    '--danger': '#E74C3C',
                    '--info': '#3498DB',
                    '--white': '#1a1a1a',
                    '--gray-50': '#2d2d2d',
                    '--gray-100': '#3d3d3d',
                    '--gray-200': '#4d4d4d',
                    '--gray-300': '#5d5d5d',
                    '--gray-400': '#6d6d6d',
                    '--gray-500': '#7d7d7d',
                    '--gray-600': '#8d8d8d',
                    '--gray-700': '#9d9d9d',
                    '--gray-800': '#adadad',
                    '--gray-900': '#dedede',
                    '--cdek-primary': '#FF8E53',
                    '--cdek-secondary': '#FF6B35',
                    '--megamarket-primary': '#3498DB',
                    '--megamarket-secondary': '#2980B9',
                    '--shadow': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)',
                    '--shadow-md': '0 4px 6px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2)',
                    '--shadow-lg': '0 10px 25px rgba(0,0,0,0.3), 0 5px 10px rgba(0,0,0,0.2)'
                },
                professional: {
                    '--primary': '#2C3E50',
                    '--primary-dark': '#34495E',
                    '--secondary': '#7F8C8D',
                    '--accent': '#E67E22',
                    '--success': '#27AE60',
                    '--warning': '#F39C12',
                    '--danger': '#C0392B',
                    '--info': '#3498DB',
                    '--white': '#ffffff',
                    '--gray-50': '#ECF0F1',
                    '--gray-100': '#D5DBDB',
                    '--gray-200': '#A6ACAF',
                    '--gray-300': '#85929E',
                    '--gray-400': '#5D6D7E',
                    '--gray-500': '#34495E',
                    '--gray-600': '#2C3E50',
                    '--gray-700': '#273746',
                    '--gray-800': '#212F3D',
                    '--gray-900': '#1C2833',
                    '--cdek-primary': '#E74C3C',
                    '--cdek-secondary': '#EC7063',
                    '--megamarket-primary': '#3498DB',
                    '--megamarket-secondary': '#5DADE2',
                    '--shadow': '0 2px 4px rgba(44,62,80,0.1)',
                    '--shadow-md': '0 4px 8px rgba(44,62,80,0.15)',
                    '--shadow-lg': '0 8px 16px rgba(44,62,80,0.2)'
                }
            },
            
            SETTINGS: {
                // ... существующие настройки ...
                THEME: 'auto',
                THEME_MODE: 'light', // light, dark, professional
                ACCENT_COLOR: '#3498DB',
                FONT_SIZE: 'medium', // small, medium, large
                ANIMATIONS: true,
                REDUCE_MOTION: false
            }
        };
        
        this.config = { ...this.defaultConfig };
        this.loadConfig();
    }

    // ... существующие методы ...

    applyTheme() {
        const themeMode = this.get('SETTINGS.THEME_MODE', 'light');
        let actualTheme = themeMode;

        if (themeMode === 'auto') {
            actualTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Применяем выбранную тему
        const themeVars = this.get(`THEMES.${actualTheme}`, this.defaultConfig.THEMES.light);
        this.applyThemeVariables(themeVars);
        
        // Применяем акцентный цвет
        this.applyAccentColor();
        
        // Применяем настройки шрифта
        this.applyFontSize();
        
        // Применяем настройки анимаций
        this.applyAnimations();

        document.documentElement.setAttribute('data-theme', actualTheme);
        document.documentElement.setAttribute('data-theme-mode', actualTheme);
    }

    applyThemeVariables(themeVars) {
        const root = document.documentElement;
        Object.entries(themeVars).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    applyAccentColor() {
        const accentColor = this.get('SETTINGS.ACCENT_COLOR', '#3498DB');
        document.documentElement.style.setProperty('--accent', accentColor);
    }

    applyFontSize() {
        const fontSize = this.get('SETTINGS.FONT_SIZE', 'medium');
        const sizes = {
            small: '14px',
            medium: '16px', 
            large: '18px'
        };
        document.documentElement.style.setProperty('--base-font-size', sizes[fontSize] || sizes.medium);
    }

    applyAnimations() {
        const animationsEnabled = this.get('SETTINGS.ANIMATIONS', true);
        const reduceMotion = this.get('SETTINGS.REDUCE_MOTION', false);
        
        if (!animationsEnabled || reduceMotion) {
            document.documentElement.style.setProperty('--transition', 'none');
        } else {
            document.documentElement.style.setProperty('--transition', 'all 0.3s ease');
        }
    }

    getAvailableThemes() {
        return Object.keys(this.defaultConfig.THEMES);
    }
}
