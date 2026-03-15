using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class IndexValueValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null || !int.TryParse(value.ToString(), out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be an integer.");
		}
		if (result < 1 || result > 500)
		{
			return new ValidationResult(isValid: false, "Provided value must be between 1 and 500.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
