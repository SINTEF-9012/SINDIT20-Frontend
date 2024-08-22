import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const TheTheme: CustomThemeConfig = {
	name: 'the-theme',
	properties: {
		// =~= Theme Properties =~=
		'--theme-font-family-base': `system-ui`,
		'--theme-font-family-heading': `system-ui`,
		'--theme-font-color-base': '0 0 0',
		'--theme-font-color-dark': '255 255 255',
		'--theme-rounded-base': '16px',
		'--theme-rounded-container': '16px',
		'--theme-border-base': '2px',
		// =~= Theme On-X Colors =~=
		'--on-primary': '0 0 0',
		'--on-secondary': '0 0 0',
		'--on-tertiary': '255 255 255',
		'--on-success': '0 0 0',
		'--on-warning': '0 0 0',
		'--on-error': '0 0 0',
		'--on-surface': '255 255 255',
		// =~= Theme Colors  =~=
		// primary | #55bf8d
		'--color-primary-50': '230 245 238', // #e6f5ee
		'--color-primary-100': '221 242 232', // #ddf2e8
		'--color-primary-200': '213 239 227', // #d5efe3
		'--color-primary-300': '187 229 209', // #bbe5d1
		'--color-primary-400': '136 210 175', // #88d2af
		'--color-primary-500': '85 191 141', // #55bf8d
		'--color-primary-600': '77 172 127', // #4dac7f
		'--color-primary-700': '64 143 106', // #408f6a
		'--color-primary-800': '51 115 85', // #337355
		'--color-primary-900': '42 94 69', // #2a5e45
		// secondary | #fa7f65
		'--color-secondary-50': '254 236 232', // #feece8
		'--color-secondary-100': '254 229 224', // #fee5e0
		'--color-secondary-200': '254 223 217', // #fedfd9
		'--color-secondary-300': '253 204 193', // #fdccc1
		'--color-secondary-400': '252 165 147', // #fca593
		'--color-secondary-500': '250 127 101', // #fa7f65
		'--color-secondary-600': '225 114 91', // #e1725b
		'--color-secondary-700': '188 95 76', // #bc5f4c
		'--color-secondary-800': '150 76 61', // #964c3d
		'--color-secondary-900': '123 62 49', // #7b3e31
		// tertiary | #2e3fc2
		'--color-tertiary-50': '224 226 246', // #e0e2f6
		'--color-tertiary-100': '213 217 243', // #d5d9f3
		'--color-tertiary-200': '203 207 240', // #cbcff0
		'--color-tertiary-300': '171 178 231', // #abb2e7
		'--color-tertiary-400': '109 121 212', // #6d79d4
		'--color-tertiary-500': '46 63 194', // #2e3fc2
		'--color-tertiary-600': '41 57 175', // #2939af
		'--color-tertiary-700': '35 47 146', // #232f92
		'--color-tertiary-800': '28 38 116', // #1c2674
		'--color-tertiary-900': '23 31 95', // #171f5f
		// success | #07f383
		'--color-success-50': '218 253 236', // #dafdec
		'--color-success-100': '205 253 230', // #cdfde6
		'--color-success-200': '193 252 224', // #c1fce0
		'--color-success-300': '156 250 205', // #9cfacd
		'--color-success-400': '81 247 168', // #51f7a8
		'--color-success-500': '7 243 131', // #07f383
		'--color-success-600': '6 219 118', // #06db76
		'--color-success-700': '5 182 98', // #05b662
		'--color-success-800': '4 146 79', // #04924f
		'--color-success-900': '3 119 64', // #037740
		// warning | #d5f307
		'--color-warning-50': '249 253 218', // #f9fdda
		'--color-warning-100': '247 253 205', // #f7fdcd
		'--color-warning-200': '245 252 193', // #f5fcc1
		'--color-warning-300': '238 250 156', // #eefa9c
		'--color-warning-400': '226 247 81', // #e2f751
		'--color-warning-500': '213 243 7', // #d5f307
		'--color-warning-600': '192 219 6', // #c0db06
		'--color-warning-700': '160 182 5', // #a0b605
		'--color-warning-800': '128 146 4', // #809204
		'--color-warning-900': '104 119 3', // #687703
		// error | #ea3913
		'--color-error-50': '252 225 220', // #fce1dc
		'--color-error-100': '251 215 208', // #fbd7d0
		'--color-error-200': '250 206 196', // #facec4
		'--color-error-300': '247 176 161', // #f7b0a1
		'--color-error-400': '240 116 90', // #f0745a
		'--color-error-500': '234 57 19', // #ea3913
		'--color-error-600': '211 51 17', // #d33311
		'--color-error-700': '176 43 14', // #b02b0e
		'--color-error-800': '140 34 11', // #8c220b
		'--color-error-900': '115 28 9', // #731c09
		// surface | #630031
		'--color-surface-50': '232 217 224', // #e8d9e0
		'--color-surface-100': '224 204 214', // #e0ccd6
		'--color-surface-200': '216 191 204', // #d8bfcc
		'--color-surface-300': '193 153 173', // #c199ad
		'--color-surface-400': '146 77 111', // #924d6f
		'--color-surface-500': '99 0 49', // #630031
		'--color-surface-600': '89 0 44', // #59002c
		'--color-surface-700': '74 0 37', // #4a0025
		'--color-surface-800': '59 0 29', // #3b001d
		'--color-surface-900': '49 0 24' // #310018
	}
};
