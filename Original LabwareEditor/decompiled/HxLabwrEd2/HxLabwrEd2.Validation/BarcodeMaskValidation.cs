using System.Globalization;
using System.Windows.Controls;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.Validation;

public class BarcodeMaskValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string text = value as string;
		if (!string.IsNullOrEmpty(text) && !BarcodeHelper.IsBarcodeMaskValid(text, out var errorDescription))
		{
			return new ValidationResult(isValid: false, errorDescription);
		}
		return new ValidationResult(isValid: true, null);
	}
}
