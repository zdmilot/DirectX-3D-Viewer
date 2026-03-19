using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class DataGridSegmentEditorHoleCountColumnValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value == null)
		{
			return new ValidationResult(isValid: false, "Property cannot be null.");
		}
		string text = value.ToString();
		if (string.IsNullOrEmpty(text))
		{
			return new ValidationResult(isValid: false, "Property cannot be blank.");
		}
		if (!int.TryParse(text, out var result))
		{
			return new ValidationResult(isValid: false, "Provided value must be an integer.");
		}
		if (result < 3 || result > 100)
		{
			return new ValidationResult(isValid: false, $"The value must be a whole number between {3}-{100}.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
