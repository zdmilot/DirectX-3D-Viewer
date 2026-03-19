using System.Globalization;
using System.Linq;
using System.Windows.Controls;
using System.Windows.Markup;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Validation;

[ContentProperty("WrappedLabware")]
public class DataGridPropertyNameColumnValidation : ValidationRule
{
	public DependencyObjectWrapper WrappedLabware { get; set; }

	public DependencyObjectWrapper WrappedSelectedProperty { get; set; }

	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string newPropertyName = value.ToString();
		if (string.IsNullOrEmpty(newPropertyName))
		{
			return new ValidationResult(isValid: false, "Property Name cannot be blank.");
		}
		if (WrappedLabware != null && WrappedLabware.WrappedObject != null && (WrappedLabware.WrappedObject as Labware).Properties.Count((Property property) => property.Name == newPropertyName) > 0 && WrappedSelectedProperty != null && WrappedSelectedProperty.WrappedObject != null && (WrappedSelectedProperty.WrappedObject as Property).Name != newPropertyName)
		{
			return new ValidationResult(isValid: false, "Property Name must be unique.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
