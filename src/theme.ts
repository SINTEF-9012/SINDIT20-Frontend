import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const TheTheme: CustomThemeConfig = {
	name: 'blue-indigo-theme',
	properties: {
		// =~= Theme Properties =~=
		'--theme-font-family-base': `system-ui`,
		'--theme-font-family-heading': `system-ui`,
		'--theme-font-color-base': '241 245 249',
		'--theme-font-color-dark': '15 23 42',
		'--theme-rounded-base': '12px',
		'--theme-rounded-container': '16px',
		'--theme-border-base': '1px',
		// =~= Theme On-X Colors =~=
		'--on-primary': '255 255 255',
		'--on-secondary': '255 255 255',
		'--on-tertiary': '255 255 255',
		'--on-success': '255 255 255',
		'--on-warning': '15 23 42',
		'--on-error': '255 255 255',
		'--on-surface': '241 245 249',
		// =~= Theme Colors  =~=
		// primary | #3b82f6 (blue-500)
		'--color-primary-50': '239 246 255', // #eff6ff
		'--color-primary-100': '219 234 254', // #dbeafe
		'--color-primary-200': '191 219 254', // #bfdbfe
		'--color-primary-300': '147 197 253', // #93c5fd
		'--color-primary-400': '96 165 250', // #60a5fa
		'--color-primary-500': '59 130 246', // #3b82f6
		'--color-primary-600': '37 99 235', // #2563eb
		'--color-primary-700': '29 78 216', // #1d4ed8
		'--color-primary-800': '30 64 175', // #1e40af
		'--color-primary-900': '30 58 138', // #1e3a8a
		// secondary | #6366f1 (indigo-500)
		'--color-secondary-50': '238 242 255', // #eef2ff
		'--color-secondary-100': '224 231 255', // #e0e7ff
		'--color-secondary-200': '199 210 254', // #c7d2fe
		'--color-secondary-300': '165 180 252', // #a5b4fc
		'--color-secondary-400': '129 140 248', // #818cf8
		'--color-secondary-500': '99 102 241', // #6366f1
		'--color-secondary-600': '79 70 229', // #4f46e5
		'--color-secondary-700': '67 56 202', // #4338ca
		'--color-secondary-800': '55 48 163', // #3730a3
		'--color-secondary-900': '49 46 129', // #312e81
		// tertiary | #1e293b (slate-800)
		'--color-tertiary-50': '248 250 252', // #f8fafc
		'--color-tertiary-100': '241 245 249', // #f1f5f9
		'--color-tertiary-200': '226 232 240', // #e2e8f0
		'--color-tertiary-300': '203 213 225', // #cbd5e1
		'--color-tertiary-400': '148 163 184', // #94a3b8
		'--color-tertiary-500': '100 116 139', // #64748b
		'--color-tertiary-600': '71 85 105', // #475569
		'--color-tertiary-700': '51 65 85', // #334155
		'--color-tertiary-800': '30 41 59', // #1e293b
		'--color-tertiary-900': '15 23 42', // #0f172a
		// success | #10b981 (emerald-500)
		'--color-success-50': '236 253 245', // #ecfdf5
		'--color-success-100': '209 250 229', // #d1fae5
		'--color-success-200': '167 243 208', // #a7f3d0
		'--color-success-300': '110 231 183', // #6ee7b7
		'--color-success-400': '52 211 153', // #34d399
		'--color-success-500': '16 185 129', // #10b981
		'--color-success-600': '5 150 105', // #059669
		'--color-success-700': '4 120 87', // #047857
		'--color-success-800': '6 95 70', // #065f46
		'--color-success-900': '6 78 59', // #064e3b
		// warning | #f59e0b (amber-500)
		'--color-warning-50': '255 251 235', // #fffbeb
		'--color-warning-100': '254 243 199', // #fef3c7
		'--color-warning-200': '253 230 138', // #fde68a
		'--color-warning-300': '252 211 77', // #fcd34d
		'--color-warning-400': '251 191 36', // #fbbf24
		'--color-warning-500': '245 158 11', // #f59e0b
		'--color-warning-600': '217 119 6', // #d97706
		'--color-warning-700': '180 83 9', // #b45309
		'--color-warning-800': '146 64 14', // #92400e
		'--color-warning-900': '120 53 15', // #78350f
		// error | #ef4444 (red-500)
		'--color-error-50': '254 242 242', // #fef2f2
		'--color-error-100': '254 226 226', // #fee2e2
		'--color-error-200': '254 202 202', // #fecaca
		'--color-error-300': '252 165 165', // #fca5a5
		'--color-error-400': '248 113 113', // #f87171
		'--color-error-500': '239 68 68', // #ef4444
		'--color-error-600': '220 38 38', // #dc2626
		'--color-error-700': '185 28 28', // #b91c1c
		'--color-error-800': '153 27 27', // #991b1b
		'--color-error-900': '127 29 29', // #7f1d1d
		// surface | #0f172a (slate-900)
		'--color-surface-50': '248 250 252', // #f8fafc
		'--color-surface-100': '241 245 249', // #f1f5f9
		'--color-surface-200': '226 232 240', // #e2e8f0
		'--color-surface-300': '203 213 225', // #cbd5e1
		'--color-surface-400': '148 163 184', // #94a3b8
		'--color-surface-500': '100 116 139', // #64748b
		'--color-surface-600': '71 85 105', // #475569
		'--color-surface-700': '51 65 85', // #334155
		'--color-surface-800': '30 41 59', // #1e293b
		'--color-surface-900': '15 23 42' // #0f172a
	}
};
