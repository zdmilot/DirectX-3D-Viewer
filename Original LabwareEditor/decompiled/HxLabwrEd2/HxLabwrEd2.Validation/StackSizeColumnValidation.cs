using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class StackSizeColumnValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (string.IsNullOrEmpty(value.ToString()))
		{
			return new ValidationResult(isValid: false, "No value assigned.");
		}
		if (!int.TryParse(value.ToString(), out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be an integer.");
		}
		if (result < 1)
		{
			return new ValidationResult(isValid: false, "Provided value must be 1 or greater.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
