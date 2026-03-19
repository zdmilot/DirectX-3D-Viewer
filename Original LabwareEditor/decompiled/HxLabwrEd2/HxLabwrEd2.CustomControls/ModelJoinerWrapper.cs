using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;
using HxCarrierModelJoiner;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.CustomControls;

public class ModelJoinerWrapper : UserControl, IComponentConnector
{
	private string[] fullPathToModels;

	internal DirectXPanel ModelJoinerDirectXPanel;

	private bool _contentLoaded;

	public ModelJoinerWrapper()
	{
		InitializeComponent();
		Messenger.Default.Register<GenericMessage<Carrier>>((object)this, (object)"InitializeModelJoiner", (Action<GenericMessage<Carrier>>)delegate(GenericMessage<Carrier> msg)
		{
			InitializeModelJoiner(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<PedestalMessage>>((object)this, (object)"UpdatePedestal", (Action<GenericMessage<PedestalMessage>>)delegate(GenericMessage<PedestalMessage> msg)
		{
			UpdateFullPathToModels(msg.Content.Position, msg.Content.ModelFilePath, msg.Content.LoadModels);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"SaveModel", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SaveModel(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<PedestalOffsetsMessage>>((object)this, (object)"UpdatePedestalOffsets", (Action<GenericMessage<PedestalOffsetsMessage>>)delegate(GenericMessage<PedestalOffsetsMessage> msg)
		{
			UpdatePedestalOffsets(msg.Content.Position, msg.Content.XOffsetOverride, msg.Content.YOffsetOverride);
		}, false);
	}

	~ModelJoinerWrapper()
	{
		Messenger.Default.Unregister((object)this);
	}

	private void InitializeModelJoiner(Carrier carrier)
	{
		fullPathToModels = new string[1 + carrier.Pedestals.Length];
		fullPathToModels[0] = carrier.Model;
		List<float> list = new List<float>();
		List<float> list2 = new List<float>();
		foreach (Offsets pedestalOffset in carrier.PedestalOffsets)
		{
			list.Add((float)(pedestalOffset.X - carrier.ModelOffsets.X));
			list2.Add((float)(carrier.Dimensions.Y - pedestalOffset.Y + carrier.ModelOffsets.Y * 3.0));
		}
		ModelJoinerDirectXPanel.SetPedestalOffsets(list, list2, (float)carrier.Dimensions.Z);
		ModelJoinerDirectXPanel.SetModelEdgeOffsets((float)carrier.ModelEdgeOffsets.X, (float)carrier.ModelEdgeOffsets.Y, (float)carrier.ModelEdgeOffsets.Z);
		ModelJoinerDirectXPanel.ResetWorld();
		LoadModels();
	}

	private void UpdateFullPathToModels(int pedestalPosition, string pedestalFilePath, bool loadModels)
	{
		fullPathToModels[pedestalPosition] = (string.IsNullOrEmpty(pedestalFilePath) ? null : Path.Combine(HxRegHelper.LabwarePath, pedestalFilePath));
		if (loadModels)
		{
			LoadModels();
		}
	}

	private void LoadModels()
	{
		ModelJoinerDirectXPanel.LoadMeshes_X(fullPathToModels);
	}

	private void SaveModel(string path)
	{
		ModelJoinerDirectXPanel.CombineAndSaveMeshes_X(path);
	}

	private void UpdatePedestalOffsets(int position, float xOffsetOverride, float yOffsetOverride)
	{
		ModelJoinerDirectXPanel.AddPedestalOffsetOverrides(position, xOffsetOverride, yOffsetOverride);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/custom%20controls/modeljoinerwrapper.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_0006: Unknown result type (might be due to invalid IL or missing references)
		//IL_0010: Expected O, but got Unknown
		if (connectionId == 1)
		{
			ModelJoinerDirectXPanel = (DirectXPanel)target;
		}
		else
		{
			_contentLoaded = true;
		}
	}
}
