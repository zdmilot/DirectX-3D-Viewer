using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.CustomControls.ContainerSegments;

public class DoubleUpDownRegularValueValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null || !double.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
		{
			return new ValidationResult(isValid: false, "Provided value is not a number.");
		}
		if (result <= 0.0)
		{
			return new ValidationResult(isValid: false, "Value must be greater than zero.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
