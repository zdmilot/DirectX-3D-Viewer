using System.Globalization;
using System.Text.RegularExpressions;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class AlphanumericEmptyValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string text = value as string;
		if (string.IsNullOrEmpty(text))
		{
			return new ValidationResult(isValid: false, "Value must be alphanumeric");
		}
		if (new Regex("^[a-zA-Z0-9]*$").IsMatch(text))
		{
			return new ValidationResult(isValid: true, null);
		}
		return new ValidationResult(isValid: false, "Value must be alphanumeric");
	}
}
