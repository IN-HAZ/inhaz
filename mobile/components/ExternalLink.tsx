import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Linking } from 'react-native';

export function ExternalLink(props: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  return (
    <Link
      {...props}
      href={props.href as any}
      onPress={(e) => {
        e.preventDefault();
        Linking.openURL(props.href);
      }}
    />
  );
}
