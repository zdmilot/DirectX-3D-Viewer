using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Threading;

namespace HxLabwrEd2.CustomControls;

public class DataGridLabwareCellEdit : UserControl, IComponentConnector
{
	internal DataGridLabwareCellEdit Cell;

	internal TextBox TextField;

	private bool _contentLoaded;

	public DataGridLabwareCellEdit()
	{
		InitializeComponent();
	}

	private void TextField_GotKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e)
	{
		base.Dispatcher.BeginInvoke((Action)delegate
		{
			TextField.SelectAll();
		}, DispatcherPriority.Normal, null);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/custom%20controls/datagridlabwarecelledit.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			Cell = (DataGridLabwareCellEdit)target;
			break;
		case 2:
			TextField = (TextBox)target;
			TextField.GotKeyboardFocus += TextField_GotKeyboardFocus;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
