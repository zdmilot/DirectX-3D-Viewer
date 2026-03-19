using System.Windows;

namespace HxLabwrEd2.Validation;

public class DependencyObjectWrapper : DependencyObject
{
	public static readonly DependencyProperty WrappedObjectDP = DependencyProperty.Register("WrappedObject", typeof(object), typeof(DependencyObjectWrapper), new FrameworkPropertyMetadata(null));

	public object WrappedObject
	{
		get
		{
			return GetValue(WrappedObjectDP);
		}
		set
		{
			SetValue(WrappedObjectDP, value);
		}
	}
}
