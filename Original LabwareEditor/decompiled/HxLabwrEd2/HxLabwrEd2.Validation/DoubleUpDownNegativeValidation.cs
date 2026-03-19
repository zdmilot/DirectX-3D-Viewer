using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class DoubleUpDownNegativeValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null || !double.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be a number.");
		}
		if (result < 0.0)
		{
			return new ValidationResult(isValid: false, "Provided value must be positive or a 0.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
