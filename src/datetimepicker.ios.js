/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This is a controlled component version of RNDateTimePicker
 *
 * @format
 * @flow strict-local
 */
import invariant from 'invariant';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ANDROID_MODE, EVENT_TYPE_SET, IOS_DISPLAY } from './constants';
import { getPickerHeightStyle } from './layoutUtilsIOS';
import RNDateTimePicker from './picker';
import { sharedPropsValidation, toMilliseconds } from './utils';

import type {
  DatePickerOptions, DateTimePickerEvent, IOSDisplay, IOSNativeProps, NativeEventIOS,
  NativeRef
} from './types';

const getDisplaySafe = (display: IOSDisplay): IOSDisplay => {
  const majorVersionIOS = parseInt(Platform.Version, 10);
  if (display === IOS_DISPLAY.inline && majorVersionIOS < 14) {
    // inline is available since 14.0
    return IOS_DISPLAY.spinner;
  }
  if (majorVersionIOS < 14) {
    // NOTE this should compare against 13.4, not 14 according to https://developer.apple.com/documentation/uikit/uidatepickerstyle/uidatepickerstylecompact?changes=latest_minor&language=objc
    // but UIDatePickerStyleCompact does not seem to work prior to 14
    // only the spinner display (UIDatePickerStyleWheels) is thus available below 14
    return IOS_DISPLAY.spinner;
  }

  return display;
};

export default function Picker({
  value,
  locale,
  maximumDate,
  minimumDate,
  style,
  testID,
  minuteInterval,
  timeZoneOffsetInMinutes,
  textColor,
  accentColor,
  themeVariant,
  onChange,
  mode = ANDROID_MODE.date,
  display: providedDisplay = IOS_DISPLAY.default,
  disabled = false,
  Element = null
}: IOSNativeProps): React.Node {
  sharedPropsValidation({value});

  const [heightStyle, setHeightStyle] = React.useState(undefined);
  const _picker: NativeRef = React.useRef(null);
  const display = getDisplaySafe(providedDisplay);
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setHasLoaded(true)
    }, 100)
  }, [])

  React.useEffect(
    function ensureNativeIsInSyncWithJS() {
      const {current} = _picker;

      if (value && onChange && current) {
        const timestamp = value.getTime();
        // $FlowFixMe Cannot call `current.setNativeProps` because property `setNativeProps` is missing in `AbstractComponent` [1].
        current.setNativeProps({
          date: timestamp,
        });
      }
    },
    [onChange, value],
  );

  React.useEffect(
    function ensureCorrectHeight() {
      const height = getPickerHeightStyle(display, mode);
      if (height instanceof Promise) {
        height.then(setHeightStyle);
      } else {
        setHeightStyle(height);
      }
    },
    [display, mode],
  );

  const _onChange = (event: NativeEventIOS) => {
    const timestamp = event.nativeEvent.timestamp;
    // $FlowFixMe Cannot assign object literal to `unifiedEvent` because number [1] is incompatible with undefined [2] in property `nativeEvent.timestamp`.
    const unifiedEvent: DateTimePickerEvent = {...event, type: EVENT_TYPE_SET};

    const date = timestamp !== undefined ? new Date(timestamp) : undefined;

    onChange && onChange(unifiedEvent, date);
  };

  invariant(value, 'A date or time should be specified as `value`.');

  if (!heightStyle) {
    // wait for height to be available in state
    return null;
  }

  const dates: DatePickerOptions = {value, maximumDate, minimumDate};
  toMilliseconds(dates, 'value', 'minimumDate', 'maximumDate');

  if (Element) {
    return (<Element 
      testID={testID}
      style={StyleSheet.compose(heightStyle, style)}
      date={hasLoaded ? dates.value : new Date(0, 0, 0, 0, 1, 5)}
      locale={locale !== null && locale !== '' ? locale : undefined}
      maximumDate={dates.maximumDate}
      minimumDate={dates.minimumDate}
      mode={mode}
      minuteInterval={minuteInterval}
      timeZoneOffsetInMinutes={timeZoneOffsetInMinutes}
      onChange={_onChange}
      textColor={textColor}
      accentColor={accentColor}
      themeVariant={themeVariant}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      displayIOS={display}
      enabled={disabled !== true}>
    </Element>);
  }

  return (
    // $FlowFixMe - dozen of flow errors
    <RNDateTimePicker
      testID={testID}
      ref={_picker}
      style={StyleSheet.compose(heightStyle, style)}
      date={hasLoaded ? dates.value : new Date(0, 0, 0, 0, 1, 5)}
      locale={locale !== null && locale !== '' ? locale : undefined}
      maximumDate={dates.maximumDate}
      minimumDate={dates.minimumDate}
      mode={mode}
      minuteInterval={minuteInterval}
      timeZoneOffsetInMinutes={timeZoneOffsetInMinutes}
      onChange={_onChange}
      textColor={textColor}
      accentColor={accentColor}
      themeVariant={themeVariant}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      displayIOS={display}
      enabled={disabled !== true}
    />
  );
}
