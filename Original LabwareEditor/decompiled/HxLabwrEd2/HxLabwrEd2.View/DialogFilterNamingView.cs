using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class DialogFilterNamingView : UserControl, IComponentConnector
{
	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal TextBox InputTextBox;

	private bool _contentLoaded;

	public DialogFilterNamingView()
	{
		InitializeComponent();
	}

	private void UserControl_Loaded(object sender, RoutedEventArgs e)
	{
		InputTextBox.SelectAll();
		Keyboard.Focus(InputTextBox);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogfilternamingview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	internal Delegate _CreateDelegate(Type delegateType, string handler)
	{
		return Delegate.CreateDelegate(delegateType, this, handler);
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			((DialogFilterNamingView)target).Loaded += UserControl_Loaded;
			break;
		case 2:
			ButtonCancel = (Button)target;
			break;
		case 3:
			ButtonOK = (Button)target;
			break;
		case 4:
			InputTextBox = (TextBox)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
