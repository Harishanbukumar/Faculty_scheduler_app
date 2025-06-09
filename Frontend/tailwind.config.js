/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        },
        colors: {
          primary: {
            50: '#ebf5ff',
            100: '#e1effe',
            200: '#c3ddfd',
            300: '#a4cafe',
            400: '#76a9fa',
            500: '#3f83f8',
            600: '#1c64f2',
            700: '#1a56db',
            800: '#1e429f',
            900: '#233876',
          },
          secondary: {
            50: '#f5f7fa',
            100: '#e4e7eb',
            200: '#cbd2d9',
            300: '#9aa5b1',
            400: '#7b8794',
            500: '#616e7c',
            600: '#52606d',
            700: '#3e4c59',
            800: '#323f4b',
            900: '#1f2933',
          },
          accent: {
            50: '#f3f9fb',
            100: '#d1edf6',
            200: '#a6dbed',
            300: '#75c6e1',
            400: '#3aa9d0',
            500: '#2490b5',
            600: '#1a7392',
            700: '#145a74',
            800: '#0e4155',
            900: '#082937',
          },
          success: {
            50: '#f3faf7',
            100: '#def7ec',
            200: '#bcf0da',
            300: '#84e1bc',
            400: '#31c48d',
            500: '#0e9f6e',
            600: '#057a55',
            700: '#046c4e',
            800: '#03543f',
            900: '#014737',
          },
          error: {
            50: '#fdf2f2',
            100: '#fde8e8',
            200: '#fbd5d5',
            300: '#f8b4b4',
            400: '#f98080',
            500: '#f05252',
            600: '#e02424',
            700: '#c81e1e',
            800: '#9b1c1c',
            900: '#771d1d',
          },
        },
        borderRadius: {
          'button': '0.375rem',
          'card': '0.5rem',
        },
        boxShadow: {
          'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }
      },
    },
    plugins: [],
  }