using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.CustomControls;

public class DataGridRackCell : UserControl, IComponentConnector
{
	public static readonly DependencyProperty ReadOnlyDP = DependencyProperty.Register("ReadOnly", typeof(bool), typeof(DataGridRackCell), new PropertyMetadata(false));

	internal DataGridRackCell Cell;

	internal Button BrowseButton;

	internal TextBlock TextField;

	private bool _contentLoaded;

	public bool ReadOnly { get; set; }

	public DataGridRackCell()
	{
		InitializeComponent();
	}

	private void Button_Click(object sender, RoutedEventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.Filter = "Rectangular or Circular Rack|*.rck;*.crk";
		openFileDialog.InitialDirectory = HxRegHelper.LabwarePath;
		if (openFileDialog.ShowDialog() == true)
		{
			TextField.Text = openFileDialog.FileName;
		}
		openFileDialog = null;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/custom%20controls/datagridrackcell.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			Cell = (DataGridRackCell)target;
			break;
		case 2:
			BrowseButton = (Button)target;
			BrowseButton.Click += Button_Click;
			break;
		case 3:
			TextField = (TextBlock)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
